// Dados dos produtos e funções de produtos
const products = [
    {
        id: 1,
        name: "realistic plus",
        category: "graphics",
        price: "US$ 20.00",
        description: "“Realistic Plus” for GTA 5 (FiveM) a stunning visual experience that takes realism to the next level. This mod was developed with the aim of creating the most complete and immersive graphical experience possible in the open world of Los Santos.",
        features: [
            "Enhanced lighting and shadows for realistic day/night cycles",
            "Improved water and reflection effects",
            "High-quality texture pack for better surface details",
            "Realistic weather system with dynamic effects",
            "Improved particle effects for explosions and fire",
            "Enhanced draw distance and LOD (Level of Detail)",
            "Optimized performance for various PC configurations",
            "Customizable graphics settings for personal preference",
            "Improved ambient occlusion and global illumination",
            "Realistic vehicle reflections and paint materials"
        ],
        icon: "fas fa-paint-brush",
        media: [
            { type: 'image', src: 'midias/products/graphics/realistic-plus/TGS_RealisticPlus.png', alt: 'realistic plus' },
            // { type: 'video', src: 'videos/empregos-preview.mp4', thumbnail: 'midias/products/empregos/thumb.jpg' },
            // { type: 'image', src: 'midias/products/empregos/2.jpg', alt: 'Painel de Profissões' }
        ]
    },
    {
        id: 2,
        name: "Advanced",
        category: "graphics",
        price: "US$ 15.00",
        description: "“Advanced” for GTA 5 (FiveM) provides an unparalleled visual and auditory experience, transforming the urban environment of Los Santos into a realistic and stunning tropical paradise. Get ready to explore the city under new horizons, where every corner reveals authentic tropical beauty.",
        features: [
            "Enhanced lighting and shadows for realistic day/night cycles",
            "Improved water and reflection effects",
            "High-quality texture pack for better surface details",
            "Realistic weather system with dynamic effects",
            "Improved particle effects for explosions and fire",
            "Enhanced draw distance and LOD (Level of Detail)",
            "Optimized performance for various PC configurations",
            "Customizable graphics settings for personal preference",
            "Improved ambient occlusion and global illumination",
            "Realistic vehicle reflections and paint materials"
        ],
        icon: "fas fa-home",
        media: [
            { type: 'image', src: 'midias/products/graphics/advanced/TGS_Advanced_logo.png', alt: 'advanced' },
            //{ type: 'video', src: 'videos/casas-preview.mp4', thumbnail: 'midias/products/casas/thumb.jpg' },
            //{ type: 'image', src: 'midias/products/casas/2.jpg', alt: 'Interior de Casa' }
        ]
    },
    {
        id: 3,
        name: "TGS M4 F82",
        category: "mods",
        price: "US$ 8.00",
        description: "BMW M4 F82.",
        features: [
            "Modelo de alta qualidade",
            "Texturas de alta qualidade",
            "Excelente adaptação para FiveM",
            "Configuração meta premiada"
        ],
        icon: "fas fa-car",
        media: [
            { type: 'image', src: 'midias/products/veiculos/TGS M4 F82/m4f82.png', alt: 'TGS M4 F82' },
            { type: 'image', src: 'midias/products/veiculos/TGS M4 F82/m4f82_2.png', alt: 'TGS M4 F82' },
            { type: 'image', src: 'midias/products/veiculos/TGS M4 F82/m4f82_3.png', alt: 'TGS M4 F82' },
            { type: 'image', src: 'midias/products/veiculos/TGS M4 F82/m4f82_4.png', alt: 'TGS M4 F82' },
            { type: 'image', src: 'midias/products/veiculos/TGS M4 F82/m4f82_5.png', alt: 'TGS M4 F82' },
            { type: 'image', src: 'midias/products/veiculos/TGS M4 F82/m4f82_6.png', alt: 'TGS M4 F82' },
            { type: 'image', src: 'midias/products/veiculos/TGS M4 F82/m4f82_7.png', alt: 'TGS M4 F82' },
            { type: 'image', src: 'midias/products/veiculos/TGS M4 F82/m4f82_8.png', alt: 'TGS M4 F82' },
            //{ type: 'video', src: 'videos/TGS M4 F82.mp4', thumbnail: 'midias/products/veiculos/TGS M4 F82/thumb.jpg' }
            
        ]
    },
    {
        id: 4,
        name: "Sistema de Gangues e Facções",
        category: "scripts",
        price: "US$ 36.00",
        description: "Sistema completo para gerenciamento de gangues e territórios.",
        features: [
            "Criação de gangues",
            "Sistema de territórios",
            "Guerras de gangue",
            "Ranking e hierarquia",
            "Interface administrativa"
        ],
        icon: "fas fa-users",
        media: [
            //{ type: 'image', src: 'midias/products/gangues/1.jpg', alt: 'Painel de Gangues' },
            //{ type: 'video', src: 'videos/gangues-preview.mp4', thumbnail: 'midias/products/gangues/thumb.jpg' },
            //{ type: 'image', src: 'midias/products/gangues/2.jpg', alt: 'Mapa de Territórios' }
        ]
    },
    {
        id: 5,
        name: "Pack de Roupas Exclusivas",
        category: "mods",
        price: "US$ 16.00",
        description: "Coleção de roupas exclusivas para seu servidor de roleplay.",
        features: [
            "100+ roupas exclusivas",
            "Texturas de alta qualidade",
            "Compatível com ESX/QBCore",
            "Fácil instalação",
            "Suporte para ambos os sexos"
        ],
        icon: "fas fa-tshirt",
        media: [
            //{ type: 'image', src: 'midias/products/roupas/1.jpg', alt: 'Roupas Exclusivas' },
            //{ type: 'video', src: 'videos/roupas-preview.mp4', thumbnail: 'midias/products/roupas/thumb.jpg' },
            //{ type: 'image', src: 'midias/products/roupas/2.jpg', alt: 'Menu de Roupas' }
        ]
    },
    {
        id: 6,
        name: "Sistema de Economia Avançado",
        category: "scripts",
        price: "US$ 50.00",
        description: "Sistema completo de economia com inflação, impostos e mercado.",
        features: [
            "Sistema de inflação dinâmico",
            "Impostos configuráveis",
            "Mercado de ações",
            "Sistema bancário avançado",
            "Relatórios detalhados"
        ],
        icon: "fas fa-chart-line",
        media: [
            //{ type: 'image', src: 'midias/products/economia/1.jpg', alt: 'Painel Econômico' },
            //{ type: 'video', src: 'videos/economia-preview.mp4', thumbnail: 'midias/products/economia/thumb.jpg' },
            //{ type: 'image', src: 'midias/products/economia/2.jpg', alt: 'Gráficos de Mercado' }
        ]
    },
    {
        id: 7,
        name: "Pack de Armas Customizadas",
        category: "mods",
        price: "US$ 20.00",
        description: "Arsenal de armas customizadas com texturas realistas.",
        features: [
            "20+ armas customizadas",
            "Texturas de alta qualidade",
            "Sons realistas",
            "Animações customizadas",
            "Compatível com ESX/QBCore"
        ],
        icon: "fas fa-gun",
        media: [
            //{ type: 'image', src: 'midias/products/armas/1.jpg', alt: 'Armas Customizadas' },
            //{ type: 'video', src: 'videos/armas-preview.mp4', thumbnail: 'midias/products/armas/thumb.jpg' },
            //{ type: 'image', src: 'midias/products/armas/2.jpg', alt: 'Menu de Armas' }
        ]
    },
    {
        id: 8,
        name: "Sistema de Polícia Avançado",
        category: "scripts",
        price: "US$ 44.00",
        description: "Sistema completo para departamento de polícia com múltiplas funcionalidades.",
        features: [
            "Sistema de multas",
            "Base de dados criminal",
            "Sistema de prisão",
            "Equipamentos policiais",
            "Interface administrativa"
        ],
        icon: "fas fa-shield-alt",
        media: [
            //{ type: 'image', src: 'midias/products/policia/1.jpg', alt: 'Painel da Polícia' },
            //{ type: 'video', src: 'videos/policia-preview.mp4', thumbnail: 'midias/products/policia/thumb.jpg' },
            //{ type: 'image', src: 'midias/products/policia/2.jpg', alt: 'Sistema de Multas' }
        ]
    }
];

const productsGrid = document.getElementById('productsGrid');
const filterButtons = document.querySelectorAll('.filter-btn');
const modal = document.getElementById('productModal');
const modalBody = document.querySelector('.modal-body');
const closeModal = document.querySelector('.close');

let currentFilter = 'all';

function loadProducts(filter = 'all') {
    const filteredProducts = filter === 'all' 
        ? products 
        : products.filter(product => product.category === filter);
    productsGrid.innerHTML = '';
    filteredProducts.forEach(product => {
        const productCard = createProductCard(product);
        productsGrid.appendChild(productCard);
    });
}

// Torna funções globais para uso nos botões
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.addToCart = addToCart;

// Adiciona evento de clique ao botão de fechar do modal
if (closeModal) {
    closeModal.addEventListener('click', closeProductModal);
}

// Carrega produtos ao iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    // Adiciona event listener nos botões de filtro
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filter = button.dataset.filter;
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            currentFilter = filter;
            loadProducts(filter);
        });
    });
});

function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card fade-in-up';
    // Verifica se existe mídia e se a primeira mídia é uma imagem
    const hasMedia = product.media && product.media.length > 0 && product.media[0].type === 'image';
    
    card.innerHTML = `
        <div class="product-image" style="${hasMedia ? 'padding: 0;' : ''}">
            ${hasMedia 
                ? `<img src="${product.media[0].src}" alt="${product.media[0].alt}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 12px 12px 0 0;">` 
                : `<i class="${product.icon}"></i>`
            }
        </div>
        <div class="product-content">
            <span class="product-category">${product.category.toUpperCase()}</span>
            <h3 class="product-title">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">${product.price}</div>
            <ul class="product-features">
                ${product.features.slice(0, 3).map(feature => `<li>${feature}</li>`).join('')}
            </ul>
            <div class="product-actions">
                <button class="btn btn-primary" onclick="openProductModal(${product.id})">
                    Ver Detalhes
                </button>
                <button class="btn btn-outline" onclick="addToCart(${product.id})">
                    Comprar
                </button>
            </div>
        </div>
    `;
    return card;
}

function openProductModal(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    // Generate media gallery HTML
    const mediaGallery = product.media && product.media.length > 0 ? `
        <div class="product-media-gallery">
            <div class="main-media">
                ${product.media[0].type === 'video' 
                    ? `<video src="${product.media[0].src}" controls poster="${product.media[0].thumbnail || ''}" class="media-item active"></video>`
                    : `<img src="${product.media[0].src}" alt="${product.media[0].alt}" class="media-item active">`
                }
            </div>
            <div class="media-thumbnails">
                ${product.media.map((media, index) => `
                    <div class="thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                        ${media.type === 'video' 
                            ? `<img src="${media.thumbnail}" alt="Thumbnail">
                               <div class="play-icon"><i class="fas fa-play"></i></div>`
                            : `<img src="${media.src}" alt="${media.alt}">`
                        }
                    </div>
                `).join('')}
            </div>
        </div>` : `
        <div class="no-media-warning">
            <i class="fas fa-image"></i>
            <p>Nenhuma mídia disponível para este produto</p>
        </div>`;

    modalBody.innerHTML = `
        <div class="modal-product">
            <div class="modal-product-header">
                <div class="modal-product-icon">
                    <i class="${product.icon}"></i>
                </div>
                <div class="modal-product-info">
                    <h2>${product.name}</h2>
                    <span class="product-category">${product.category.toUpperCase()}</span>
                </div>
            </div>
            ${mediaGallery}
            <div class="product-price-container">
                <div class="product-price">${product.price}</div>
            </div>
            <div class="modal-product-description">
                <h3>Descrição</h3>
                <p>${product.description}</p>
            </div>
            <div class="modal-product-features">
                <h3>Características</h3>
                <ul>
                    ${product.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
            <div class="modal-product-actions">
                <button class="btn btn-primary" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-cart"></i> Comprar Agora
                </button>
                <button class="btn btn-outline" onclick="closeProductModal()">
                    Fechar
                </button>
            </div>
        </div>
    `;
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Add event listeners for media gallery
    if (product.media && product.media.length > 1) {
        const thumbnails = document.querySelectorAll('.thumbnail');
        const mainMedia = document.querySelector('.main-media');
        
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', function() {
                const index = parseInt(this.getAttribute('data-index'));
                const media = product.media[index];
                
                // Update active thumbnail
                document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                
                // Update main media
                mainMedia.innerHTML = media.type === 'video'
                    ? `<video src="${media.src}" controls ${media.thumbnail ? `poster="${media.thumbnail}"` : ''} class="media-item active"></video>`
                    : `<img src="${media.src}" alt="${media.alt}" class="media-item active">`;
                
                // Autoplay video if it's a video
                const video = mainMedia.querySelector('video');
                if (video) video.play();
            });
        });
    }
}

function closeProductModal() {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    showNotification(`Produto "${product.name}" adicionado ao carrinho!`, 'success');
}
