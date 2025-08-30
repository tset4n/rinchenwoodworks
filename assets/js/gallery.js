document.addEventListener('DOMContentLoaded', () => {
  const gallery = document.getElementById('gallery');
  const pager = document.getElementById('pager');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = lightbox.querySelector('.lightbox-image');
  const lightboxClose = lightbox.querySelector('.lightbox-close');
  const lightboxPrev = lightbox.querySelector('.lightbox-prev');
  const lightboxNext = lightbox.querySelector('.lightbox-next');

  let images = [];
  let currentPage = 1;
  let totalPages = 1;
  const imagesPerPage = 16;
  let activeImageIndex = -1;

  const fetchImages = async () => {
    try {
      const response = await fetch('./assets/data/album.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      images = await response.json();
      if (images.length === 0) {
        gallery.innerHTML = '<p>No images found in the album.</p>';
        return;
      }
      totalPages = Math.ceil(images.length / imagesPerPage);
      renderGallery();
      renderPagination();
      console.log(`Loaded ${images.length} images from Album/`);
    } catch (error) {
      console.error('Error fetching gallery images:', error);
      gallery.innerHTML = '<p>Sorry, we could not load the images at this time.</p>';
    }
  };

  const renderGallery = () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentPage = parseInt(urlParams.get('page')) || 1;
    if (currentPage < 1) currentPage = 1;
    if (currentPage > totalPages) currentPage = totalPages;

    gallery.innerHTML = '';
    const start = (currentPage - 1) * imagesPerPage;
    const end = start + imagesPerPage;
    const pageImages = images.slice(start, end);

    pageImages.forEach((item, index) => {
      const galleryItem = document.createElement('div');
      galleryItem.className = 'gallery-item';
      const img = document.createElement('img');
      img.src = `./${encodeURI(item.src)}`;
      img.alt = item.alt || `Gallery image ${start + index + 1}`;
      img.loading = 'lazy';
      img.decoding = 'async';
      galleryItem.appendChild(img);
      galleryItem.addEventListener('click', () => openLightbox(start + index));
      gallery.appendChild(galleryItem);
    });
  };

  const renderPagination = () => {
    pager.innerHTML = '';
    if (totalPages <= 1) return;

    const createPageLink = (page, text, isDisabled = false) => {
      const link = document.createElement('a');
      link.href = `?page=${page}`;
      link.textContent = text;
      if (isDisabled) {
        link.classList.add('disabled');
        link.setAttribute('aria-disabled', 'true');
        link.tabIndex = -1;
      }
      if (page === currentPage) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
      link.addEventListener('click', (e) => {
        e.preventDefault();
        if (!isDisabled) {
          currentPage = page;
          history.pushState({ page: currentPage }, `Page ${currentPage}`, `?page=${currentPage}`);
          renderGallery();
          renderPagination();
        }
      });
      return link;
    };

    pager.appendChild(createPageLink(currentPage - 1, 'Prev', currentPage === 1));

    for (let i = 1; i <= totalPages; i++) {
      pager.appendChild(createPageLink(i, i));
    }

    pager.appendChild(createPageLink(currentPage + 1, 'Next', currentPage === totalPages));
  };

  const openLightbox = (index) => {
    activeImageIndex = index;
    updateLightboxImage();
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    trapFocus(lightbox);
  };

  const closeLightbox = () => {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  };

  const updateLightboxImage = () => {
    lightboxImage.src = `./${encodeURI(images[activeImageIndex].src)}`;
    lightboxImage.alt = images[activeImageIndex].alt || `Gallery image ${activeImageIndex + 1}`;
  };

  const showPrevImage = () => {
    activeImageIndex = (activeImageIndex - 1 + images.length) % images.length;
    updateLightboxImage();
  };

  const showNextImage = () => {
    activeImageIndex = (activeImageIndex + 1) % images.length;
    updateLightboxImage();
  };

  const trapFocus = (element) => {
    const focusableElements = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    element.addEventListener('keydown', (e) => {
      if (e.key !== 'Tab') return;
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    });
    firstElement.focus();
  };

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  lightboxPrev.addEventListener('click', showPrevImage);
  lightboxNext.addEventListener('click', showNextImage);

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showPrevImage();
    if (e.key === 'ArrowRight') showNextImage();
  });

  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.page) {
      currentPage = e.state.page;
      renderGallery();
      renderPagination();
    }
  });

  fetchImages();
});
