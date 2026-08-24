(() => {
  const $ = selector => document.querySelector(selector);
  const cameraInput = $('#cameraInput');
  const galleryInput = $('#galleryInput');
  const editor = $('#addItemEditorSheet');
  const canvas = $('#addItemCropCanvas');
  const nameInput = $('#addItemName');
  const categorySelect = $('#addItemCategory');
  const zoomInput = $('#addItemZoom');
  const saveButton = $('#addItemSave');
  const cancelButton = $('#addItemCancel');
  const retakeButton = $('#addItemRetake');
  if (!cameraInput || !galleryInput || !editor || !canvas || !window.WardRobeDB) return;

  const ui = window.__wardrobeUI || {};
  const ctx = canvas.getContext('2d', { alpha: false });
  const state = {
    image: null,
    sourceUrl: null,
    file: null,
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    dragging: false,
    pointerId: null,
    dragX: 0,
    dragY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  };

  const userItems = () => Array.isArray(window.__wardrobeItems) ? window.__wardrobeItems : [];
  const nowDays = ts => Math.max(0, Math.floor((Date.now() - Number(ts || Date.now())) / 86400000));
  const makeId = () => `user-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`}`;

  function toUiItem(record) {
    return {
      id: record.id,
      name: record.name,
      category: record.category,
      img: URL.createObjectURL(record.imageBlob),
      createdAt: record.createdAt,
      recent: true,
      days: nowDays(record.createdAt),
      userAdded: true,
      persistent: true,
      fit: record.fit || { x: 0, y: 0, scale: 1, rotation: 0 },
    };
  }

  async function hydratePersistedItems() {
    try {
      const persisted = await window.WardRobeDB.listItems();
      const items = userItems();
      const existing = new Set(items.map(item => item.id));
      for (const record of persisted) {
        if (!existing.has(record.id) && record.imageBlob instanceof Blob) items.push(toUiItem(record));
      }
      window.__wardrobeWardrobe?.syncWardrobeView?.();
    } catch (error) {
      console.warn('[WardRobe] IndexedDB hydrate failed', error);
    }
  }

  function closeEditor() {
    ui.closeSheets?.();
    resetEditor();
  }

  function resetEditor() {
    if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
    state.image = null;
    state.sourceUrl = null;
    state.file = null;
    state.zoom = 1;
    state.offsetX = 0;
    state.offsetY = 0;
    if (zoomInput) zoomInput.value = '1';
    if (nameInput) nameInput.value = '';
    cameraInput.value = '';
    galleryInput.value = '';
    ctx.fillStyle = '#f1ebe5';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  function clampOffsets() {
    if (!state.image) return;
    const base = Math.max(canvas.width / state.image.naturalWidth, canvas.height / state.image.naturalHeight);
    const scale = base * state.zoom;
    const drawnW = state.image.naturalWidth * scale;
    const drawnH = state.image.naturalHeight * scale;
    const maxX = Math.max(0, (drawnW - canvas.width) / 2);
    const maxY = Math.max(0, (drawnH - canvas.height) / 2);
    state.offsetX = Math.min(maxX, Math.max(-maxX, state.offsetX));
    state.offsetY = Math.min(maxY, Math.max(-maxY, state.offsetY));
  }

  function renderCrop() {
    if (!state.image) return;
    clampOffsets();
    const base = Math.max(canvas.width / state.image.naturalWidth, canvas.height / state.image.naturalHeight);
    const scale = base * state.zoom;
    const w = state.image.naturalWidth * scale;
    const h = state.image.naturalHeight * scale;
    const x = (canvas.width - w) / 2 + state.offsetX;
    const y = (canvas.height - h) / 2 + state.offsetY;
    ctx.fillStyle = '#f7f3ee';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(state.image, x, y, w, h);
  }

  async function loadSelectedFile(file) {
    if (!file || !file.type.startsWith('image/')) {
      ui.showToast?.('Scegli una foto valida');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      ui.showToast?.('Foto troppo grande');
      return;
    }
    if (state.sourceUrl) URL.revokeObjectURL(state.sourceUrl);
    state.file = file;
    state.sourceUrl = URL.createObjectURL(file);
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      state.image = image;
      state.zoom = 1;
      state.offsetX = 0;
      state.offsetY = 0;
      zoomInput.value = '1';
      const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim();
      nameInput.value = baseName && !/^image\s*\d*$/i.test(baseName) ? baseName.slice(0, 42) : '';
      renderCrop();
      ui.openSheet?.('addItemEditorSheet');
      setTimeout(() => nameInput.focus({ preventScroll: true }), 250);
    };
    image.onerror = () => ui.showToast?.('Impossibile leggere la foto');
    image.src = state.sourceUrl;
  }

  function canvasBlob() {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Crop non riuscito')), 'image/jpeg', 0.9);
    });
  }

  async function saveItem() {
    if (!state.image) return;
    const name = nameInput.value.trim() || 'Nuovo capo';
    const category = categorySelect.value;
    if (!category) {
      ui.showToast?.('Scegli una categoria');
      return;
    }
    saveButton.disabled = true;
    saveButton.textContent = 'Salvataggio…';
    try {
      const imageBlob = await canvasBlob();
      const record = {
        id: makeId(),
        name: name.slice(0, 50),
        category,
        createdAt: Date.now(),
        imageBlob,
        crop: { zoom: state.zoom, offsetX: state.offsetX, offsetY: state.offsetY },
        fit: { x: 0, y: 0, scale: 1, rotation: 0 },
        source: state.file?.name || 'camera',
      };
      await window.WardRobeDB.saveItem(record);
      userItems().push(toUiItem(record));
      ui.closeSheets?.();
      window.__wardrobeWardrobe?.syncWardrobeView?.();
      window.__wardrobeWardrobe?.openCategory?.(category);
      ui.showToast?.('Capo salvato');
      resetEditor();
    } catch (error) {
      console.error('[WardRobe] save item failed', error);
      ui.showToast?.('Non riesco a salvare il capo');
    } finally {
      saveButton.disabled = false;
      saveButton.textContent = 'Salva nel Wardrobe';
    }
  }

  async function deleteItem(id) {
    const item = userItems().find(entry => entry.id === id);
    if (!item?.userAdded) {
      ui.showToast?.('I capi demo non si eliminano');
      return;
    }
    try {
      await window.WardRobeDB.deleteItem(id);
      const items = userItems();
      const index = items.findIndex(entry => entry.id === id);
      if (index >= 0) {
        const [removed] = items.splice(index, 1);
        if (removed?.img?.startsWith('blob:')) URL.revokeObjectURL(removed.img);
      }
      ui.closeSheets?.();
      window.__wardrobeWardrobe?.syncWardrobeView?.();
      window.__wardrobeWardrobe?.renderCategoryItems?.();
      ui.showToast?.('Capo eliminato');
    } catch (error) {
      console.error('[WardRobe] delete item failed', error);
      ui.showToast?.('Eliminazione non riuscita');
    }
  }

  $('#cameraChoice')?.addEventListener('click', () => cameraInput.click());
  $('#galleryChoice')?.addEventListener('click', () => galleryInput.click());
  cameraInput.addEventListener('change', event => loadSelectedFile(event.target.files?.[0]));
  galleryInput.addEventListener('change', event => loadSelectedFile(event.target.files?.[0]));
  zoomInput?.addEventListener('input', () => {
    state.zoom = Number(zoomInput.value || 1);
    renderCrop();
  });

  canvas.addEventListener('pointerdown', event => {
    if (!state.image) return;
    state.dragging = true;
    state.pointerId = event.pointerId;
    state.dragX = event.clientX;
    state.dragY = event.clientY;
    state.startOffsetX = state.offsetX;
    state.startOffsetY = state.offsetY;
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!state.dragging || state.pointerId !== event.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    const sx = canvas.width / Math.max(1, rect.width);
    const sy = canvas.height / Math.max(1, rect.height);
    state.offsetX = state.startOffsetX + (event.clientX - state.dragX) * sx;
    state.offsetY = state.startOffsetY + (event.clientY - state.dragY) * sy;
    renderCrop();
  });
  const endDrag = event => {
    if (state.pointerId !== event.pointerId) return;
    state.dragging = false;
    state.pointerId = null;
  };
  canvas.addEventListener('pointerup', endDrag);
  canvas.addEventListener('pointercancel', endDrag);

  saveButton?.addEventListener('click', saveItem);
  cancelButton?.addEventListener('click', closeEditor);
  retakeButton?.addEventListener('click', () => {
    ui.closeSheets?.();
    resetEditor();
    setTimeout(() => ui.openSheet?.('addItemSheet'), 80);
  });

  window.WardRobeAddItem = { saveItem, deleteItem, hydratePersistedItems, renderCrop };
  hydratePersistedItems();
})();
