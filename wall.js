const accessKey = 'VEGuFH9iISNtniEcPUFdOUEeu2WHJXBAnBOtoSJ93ro';
let page = 1, query = '', category = '';
const gallery = document.getElementById('gallery');
const loader = document.getElementById('loader');
const favBtn = document.getElementById('favorites-btn');
const signOutBtn = document.getElementById('sign-out-btn');
const authBtn = document.getElementById('auth-btn');
const userInfo = document.getElementById('user-info');
const userNameSpan = document.getElementById('user-name');
const backToTop = document.getElementById('back-to-top');
const themeToggle = document.getElementById('theme-toggle');
const micBtn = document.getElementById('mic-btn');
const toast = document.getElementById('toast');
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
const lightboxClose = document.getElementById('lightbox-close');
const lightboxPrev = document.getElementById('lightbox-prev');
const lightboxNext = document.getElementById('lightbox-next');
let currentLightboxIndex = 0;
let imageList = [];
let favorites = JSON.parse(localStorage.getItem('favorites') || '[]');

async function initAuth() {
  await Clerk.load();
  if (Clerk.user) {
    authBtn.classList.add('hidden');
    favBtn.classList.remove('hidden');
    signOutBtn.classList.remove('hidden');
    userInfo.classList.remove('hidden');
    const user = Clerk.user;
    userNameSpan.textContent = user.fullName || user.emailAddresses[0].emailAddress;
  } else {
    authBtn.classList.remove('hidden');
    favBtn.classList.add('hidden');
    signOutBtn.classList.add('hidden');
    userInfo.classList.add('hidden');
  }

  signOutBtn.onclick = async () => {
    await Clerk.signOut();
    window.location.reload();
  };
}

async function fetchImages() {
  loader.classList.remove('hidden');
  let images = [];

  let url = `https://api.unsplash.com/photos?client_id=${accessKey}&page=${page}&per_page=12`;
  if (query) url = `https://api.unsplash.com/search/photos?client_id=${accessKey}&query=${query}&page=${page}&per_page=12`;
  if (category) url = `https://api.unsplash.com/search/photos?client_id=${accessKey}&query=${category}&page=${page}&per_page=12`;

  const res = await fetch(url);
  const data = await res.json();
  images = data.results || data;
  imageList = [...imageList, ...images];

  images.forEach((img, idx) => {
    const tpl = document.getElementById('wallpaper-template');
    const node = tpl.content.cloneNode(true);
    const imgTag = node.querySelector('img');
    imgTag.src = img.urls.small;
    imgTag.alt = img.alt_description || 'Wallpaper';
    imgTag.addEventListener('click', () => openLightbox(img.urls.full));

    node.querySelector('.download').href = `${img.links.download}?force=true`;
    node.querySelector('.author-name').textContent = img.user.name || 'Unknown';
    node.querySelector('.likes-count').textContent = img.likes || 0;
    node.querySelector('.res-info').textContent = `${img.width}x${img.height}`;

    const heart = node.querySelector('.fav-btn i');
    if (favorites.some(f => f.id === img.id)) heart.classList.add('favorited');

    node.querySelector('.fav-btn').onclick = () => handleFavoriteToggle(img.id, heart, img);
    gallery.appendChild(node);
  });

  loader.classList.add('hidden');
}

function handleFavoriteToggle(id, heartIcon, fullImgObj) {
  if (!Clerk.user) return showModal();

  let favList = JSON.parse(localStorage.getItem('favorites') || '[]');
  const isAlready = favList.some(fav => fav.id === id);

  if (isAlready) {
    favList = favList.filter(fav => fav.id !== id);
    heartIcon.classList.remove('favorited');
  } else {
    favList.push(fullImgObj);
    heartIcon.classList.add('favorited');
    showToast('Added to favorites');
  }

  localStorage.setItem('favorites', JSON.stringify(favList));
  favorites = favList;
}

function showModal() {
  const modal = document.getElementById('modal');
  modal.classList.remove('hidden');
  document.getElementById('modal-confirm').onclick = () => window.location.href = 'auth.html';
  document.getElementById('modal-cancel').onclick = () => modal.classList.add('hidden');
}

function openLightbox(url) {
  lightbox.classList.remove('hidden');
  lightboxImg.src = url;
}

lightboxClose.onclick = () => lightbox.classList.add('hidden');
lightboxPrev.onclick = () => {
  if (currentLightboxIndex > 0) {
    currentLightboxIndex--;
    openLightbox(imageList[currentLightboxIndex].urls.full);
  }
};
lightboxNext.onclick = () => {
  if (currentLightboxIndex < imageList.length - 1) {
    currentLightboxIndex++;
    openLightbox(imageList[currentLightboxIndex].urls.full);
  }
};

backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
window.addEventListener('scroll', () => {
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 1000) {
    page++;
    fetchImages();
  }
  backToTop.style.display = window.scrollY > 200 ? 'block' : 'none';
});

document.getElementById('search-btn').addEventListener('click', () => {
  query = document.getElementById('search-input').value.trim();
  category = '';
  page = 1;
  gallery.innerHTML = '';
  imageList = [];
  fetchImages();
});

Array.from(document.getElementsByClassName('category-btn')).forEach(btn => {
  btn.addEventListener('click', () => {
    category = btn.getAttribute('data-cat');
    query = '';
    page = 1;
    gallery.innerHTML = '';
    imageList = [];
    fetchImages();
  });
});

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark-theme');
});

micBtn.addEventListener('click', () => {
  const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    document.getElementById('search-input').value = transcript;
    document.getElementById('search-btn').click();
  };
  recognition.start();
});

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

window.addEventListener('load', () => {
  initAuth();
  fetchImages();
});
