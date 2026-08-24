(() => {
  const db = window.WardRobeDB;
  const homeAvatar = document.getElementById('avatar');
  const dressingAvatar = document.getElementById('dressingAvatar');
  const onboarding = document.getElementById('avatarOnboarding');
  const sourcePanel = document.getElementById('avatarSourcePanel');
  const editor = document.getElementById('avatarEditor');
  const canvas = document.getElementById('avatarCropCanvas');
  const ctx = canvas?.getContext('2d');
  const zoomInput = document.getElementById('avatarZoom');
  const settingsPreview = document.getElementById('avatarSettingsPreview');
  const settingsMode = document.getElementById('avatarSettingsMode');

  if (!db || !homeAvatar || !dressingAvatar || !onboarding || !editor || !canvas || !ctx) return;

  const demoHomeSrc = homeAvatar.src;
  const demoDressingSrc = dressingAvatar.src;
  let currentObjectUrl = null;
  let sourceObjectUrl = null;
  let sourceImage = null;
  let sourceFile = null;
  let profile = null;
  let state = { zoom: 1, offsetX: 0, offsetY: 0 };
  let pointer = null;

  const toast = message => window.__wardrobeUI?.showToast?.(message);

  function setModalState(open) {
    document.documentElement.classList.toggle('avatar-modal-open', open);
  }

  function showOnboarding(show = true) {
    onboarding.classList.toggle('show', show);
    onboarding.setAttribute('aria-hidden', show ? 'false' : 'true');
    if (!show) sourcePanel?.classList.remove('show');
    setModalState(show || editor.classList.contains('show'));
  }

  function showEditor(show = true) {
    editor.classList.toggle('show', show);
    editor.setAttribute('aria-hidden', show ? 'false' : 'true');
    setModalState(show || onboarding.classList.contains('show'));
  }

  function revokeCurrentUrl() {
    if (currentObjectUrl) URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }

  function revokeSourceUrl() {
    if (sourceObjectUrl) URL.revokeObjectURL(sourceObjectUrl);
    sourceObjectUrl = null;
  }

  function setAvatarPresentation(personal) {
    homeAvatar.classList.toggle('personal-avatar', personal);
    dressingAvatar.classList.toggle('personal-avatar', personal);
  }

  function updateSettings(mode, src) {
    if (settingsMode) settingsMode.textContent = mode === 'personal' ? 'La tua foto' : 'Avatar demo';
    if (!settingsPreview) return;
    settingsPreview.replaceChildren();
    const img = document.createElement('img');
    img.alt = '';
    img.src = src || demoHomeSrc;
    settingsPreview.appendChild(img);
  }

  function applyProfile(nextProfile) {
    profile = nextProfile || { key: 'main-avatar', mode: 'demo', updatedAt: Date.now() };
    revokeCurrentUrl();
    if (profile.mode === 'personal' && profile.imageBlob instanceof Blob) {
      currentObjectUrl = URL.createObjectURL(profile.imageBlob);
      homeAvatar.src = currentObjectUrl;
      dressingAvatar.src = currentObjectUrl;
      setAvatarPresentation(true);
      updateSettings('personal', currentObjectUrl);
    } else {
      homeAvatar.src = demoHomeSrc;
      dressingAvatar.src = demoDressingSrc;
      setAvatarPresentation(false);
      updateSettings('demo', demoHomeSrc);
    }
    return profile;
  }

  function resetCrop() {
    state = { zoom: 1, offsetX: 0, offsetY: 0 };
    if (zoomInput) zoomInput.value = '1';
    drawCrop();
  }

  function drawCrop() {
    if (!sourceImage) return;
    const w = canvas.width, h = canvas.height;
    ctx.save();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#fff4ef';
    ctx.fillRect(0, 0, w, h);
    const iw = sourceImage.naturalWidth || sourceImage.width;
    const ih = sourceImage.naturalHeight || sourceImage.height;
    const base = Math.min(w / iw, h / ih);
    const scale = base * state.zoom;
    const dw = iw * scale;
    const dh = ih * scale;
    const x = (w - dw) / 2 + state.offsetX;
    const y = (h - dh) / 2 + state.offsetY;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(sourceImage, x, y, dw, dh);
    ctx.restore();
  }

  function loadFile(file) {
    if (!file || !file.type?.startsWith('image/')) return;
    sourceFile = file;
    revokeSourceUrl();
    sourceObjectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      sourceImage = img;
      resetCrop();
      showOnboarding(false);
      showEditor(true);
    };
    img.onerror = () => toast('Non riesco a leggere questa foto');
    img.src = sourceObjectUrl;
  }

  async function saveDemo() {
    try {
      const saved = await db.saveAvatarProfile({ mode: 'demo', updatedAt: Date.now() });
      applyProfile(saved);
      showOnboarding(false);
      toast('Avatar demo impostato');
    } catch {
      applyProfile({ mode: 'demo', updatedAt: Date.now() });
      showOnboarding(false);
      toast('Uso l’avatar demo su questo dispositivo');
    }
  }

  function canvasToBlob() {
    return new Promise((resolve, reject) => {
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Immagine non disponibile')), 'image/jpeg', 0.9);
    });
  }

  async function savePersonal() {
    if (!sourceImage || !sourceFile) return;
    const button = document.getElementById('avatarSave');
    if (button) { button.disabled = true; button.textContent = 'Salvo…'; }
    try {
      const imageBlob = await canvasToBlob();
      const saved = await db.saveAvatarProfile({
        mode: 'personal', updatedAt: Date.now(), imageBlob,
        crop: { zoom: state.zoom, offsetX: state.offsetX, offsetY: state.offsetY }
      });
      applyProfile(saved);
      showEditor(false);
      showOnboarding(false);
      toast('Il tuo personaggio è pronto');
    } catch (error) {
      console.error(error);
      toast('Non riesco a salvare la foto');
    } finally {
      if (button) { button.disabled = false; button.textContent = 'Usa questa foto'; }
    }
  }

  function cancelEditor() {
    showEditor(false);
    sourceImage = null;
    sourceFile = null;
    revokeSourceUrl();
    if (!profile) showOnboarding(true);
  }

  async function hydrate() {
    try {
      const saved = await db.getAvatarProfile();
      if (saved) {
        applyProfile(saved);
        showOnboarding(false);
      } else {
        updateSettings('demo', demoHomeSrc);
        showOnboarding(true);
      }
    } catch (error) {
      console.warn('WardRobe avatar fallback', error);
      applyProfile({ mode: 'demo', updatedAt: Date.now() });
      showOnboarding(false);
      toast('Personaggio locale non disponibile: uso quello demo');
    }
  }

  function openOnboarding() {
    window.__wardrobeUI?.closeSheets?.();
    showOnboarding(true);
  }

  document.getElementById('avatarUsePhoto')?.addEventListener('click', () => sourcePanel?.classList.add('show'));
  document.getElementById('avatarUseDemo')?.addEventListener('click', saveDemo);
  document.getElementById('avatarCameraChoice')?.addEventListener('click', () => document.getElementById('avatarCameraInput')?.click());
  document.getElementById('avatarGalleryChoice')?.addEventListener('click', () => document.getElementById('avatarGalleryInput')?.click());
  document.getElementById('avatarCameraInput')?.addEventListener('change', e => { loadFile(e.target.files?.[0]); e.target.value = ''; });
  document.getElementById('avatarGalleryInput')?.addEventListener('change', e => { loadFile(e.target.files?.[0]); e.target.value = ''; });
  document.getElementById('avatarReset')?.addEventListener('click', resetCrop);
  document.getElementById('avatarSave')?.addEventListener('click', savePersonal);
  document.getElementById('avatarCancel')?.addEventListener('click', cancelEditor);
  document.getElementById('changeAvatarBtn')?.addEventListener('click', openOnboarding);

  zoomInput?.addEventListener('input', () => {
    state.zoom = Number(zoomInput.value || 1);
    drawCrop();
  });

  canvas.addEventListener('pointerdown', event => {
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, offsetX: state.offsetX, offsetY: state.offsetY };
    canvas.setPointerCapture?.(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    const rect = canvas.getBoundingClientRect();
    state.offsetX = pointer.offsetX + (event.clientX - pointer.x) * (canvas.width / rect.width);
    state.offsetY = pointer.offsetY + (event.clientY - pointer.y) * (canvas.height / rect.height);
    drawCrop();
  });
  const endPointer = event => {
    if (!pointer || (event.pointerId != null && pointer.id !== event.pointerId)) return;
    pointer = null;
  };
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);

  window.addEventListener('beforeunload', () => { revokeCurrentUrl(); revokeSourceUrl(); });
  window.WardRobeAvatar = { openOnboarding, applyProfile, hydrate };
  hydrate();
})();
