// Application constants and configuration

export const JEWELLERY_TYPES = [
  { id: "ring", label: "Ring", icon: "ring" },
  { id: "necklace", label: "Necklace", icon: "necklace" },
  { id: "earrings", label: "Earrings", icon: "earrings" },
  { id: "bangle", label: "Bangle", icon: "bangle" },
  { id: "bracelet", label: "Bracelet", icon: "bracelet" },
  { id: "pendant", label: "Pendant", icon: "pendant" },
  { id: "mangalsutra", label: "Mangalsutra", icon: "mangalsutra" },
  { id: "anklet", label: "Anklet", icon: "anklet" },
];

export const PRODUCT_PRESETS = [
  {
    id: "luxury-studio",
    label: "Luxury Studio Light",
    description: "Premium studio setup with soft, diffused lighting on neutral background",
    image: "https://images.unsplash.com/photo-1716538049422-61f3b9ba3b86?w=600&h=600&fit=crop",
  },
  {
    id: "heritage-temple",
    label: "Heritage Indian Temple",
    description: "Traditional temple backdrop with warm golden lighting and heritage elements",
    image: "https://images.unsplash.com/photo-1758995115560-59c10d6cc28f?w=600&h=600&fit=crop",
  },
  {
    id: "minimal-pastel",
    label: "Soft Pastel Minimal",
    description: "Clean, minimalist aesthetic with soft pastel backgrounds",
    image: "https://images.unsplash.com/photo-1671642883395-0ab89c3ac890?w=600&h=600&fit=crop",
  },
  {
    id: "dark-premium",
    label: "Dark Premium Black Gold",
    description: "Moody dark background with dramatic gold accents and luxury feel",
    image: "https://images.unsplash.com/photo-1723802205505-2f88b2227718?w=600&h=600&fit=crop",
  },
  {
    id: "festive-indian",
    label: "Festive Indian Mood",
    description: "Vibrant festive atmosphere with traditional Indian elements",
    image: "https://images.unsplash.com/photo-1659708722557-3804cf131098?w=600&h=600&fit=crop",
  },
  {
    id: "natural-daylight",
    label: "Natural Daylight Window",
    description: "Soft natural light from window creating gentle shadows",
    image: "https://images.unsplash.com/photo-1659708701940-e60893ef03d0?w=600&h=600&fit=crop",
  },
  {
    id: "editorial",
    label: "High-Contrast Editorial",
    description: "Fashion magazine style with bold contrasts and artistic composition",
    image: "https://images.unsplash.com/photo-1647780954399-a220fd047916?w=600&h=600&fit=crop",
  },
  {
    id: "flatlay-ecommerce",
    label: "Flatlay Ecommerce Clean",
    description: "Clean overhead shot perfect for online catalogs and stores",
    image: "https://images.unsplash.com/photo-1578503803703-e818b8a0e00b?w=600&h=600&fit=crop",
  },
  {
    id: "green-t3",
    label: "GREEN-T3",
    description: "High-end green velvet jewellery box with emerald silk backdrop and dramatic studio lighting",
    image: "https://images.unsplash.com/photo-1617117832626-14c71583d8c1?q=80\u0026w=600\u0026h=600\u0026auto=format\u0026fit=crop",
  },
  {
    id: "maroon-brocade",
    label: "Maroon Brocade Drapery Luxury",
    description: "Rich maroon silk brocade fabric with scattered jasmine flowers and warm luxury lighting",
    image: "https://images.unsplash.com/photo-1601050690597-df0568f70950?q=80\u0026w=600\u0026h=600\u0026auto=format\u0026fit=crop",
  },
  {
    id: "white-bg",
    label: "WHITE BG",
    description: "Clean, clinical white background for professional e-commerce product photography with subtle reflections",
    image: "https://images.unsplash.com/photo-1549490349-8643362247b5?q=80\u0026w=600\u0026h=600\u0026auto=format\u0026fit=crop",
  },
  {
    id: "warm-light-gray",
    label: "Warm light gray",
    description: "Minimalist studio luxury on warm grey stone platform with soft shadows and premium neutral look",
    image: "https://images.unsplash.com/photo-1594913366159-1832fc6751bc?q=80\u0026w=600\u0026h=600\u0026auto=format\u0026fit=crop",
  },
];

export const MODEL_PRESETS = [
  {
    id: "bridal-outdoor",
    label: "Indian Bridal Outdoor",
    description: "Beautiful outdoor setting with traditional Indian bride wearing jewellery",
    image: "https://images.unsplash.com/photo-1740431377901-c2f28d50c759?w=600&h=600&fit=crop",
  },
  {
    id: "urban-fashion",
    label: "Urban Fashion Street",
    description: "Modern urban street style with contemporary fashion model",
    image: "https://images.unsplash.com/photo-1556859438-6845d3f1116e?w=600&h=600&fit=crop",
  },
  {
    id: "luxury-hotel",
    label: "Luxury Hotel Lobby",
    description: "Elegant hotel interior with sophisticated ambiance",
    image: "https://images.pexels.com/photos/10773467/pexels-photo-10773467.jpeg?w=600&h=600&fit=crop",
  },
  {
    id: "festive-family",
    label: "Festive Family Function",
    description: "Warm celebration atmosphere with traditional Indian attire",
    image: "https://images.pexels.com/photos/16141929/pexels-photo-16141929.jpeg?w=600&h=600&fit=crop",
  },
  {
    id: "studio-portrait",
    label: "Modern Studio Portrait",
    description: "Clean studio portrait with professional lighting",
    image: "https://images.unsplash.com/photo-1647780954399-a220fd047916?w=600&h=600&fit=crop",
  },
  {
    id: "saree-traditional",
    label: "Traditional Saree Look",
    description: "Classic Indian saree styling with traditional jewellery",
    image: "https://images.unsplash.com/photo-1740431377901-c2f28d50c759?w=600&h=600&fit=crop",
  },
  {
    id: "indo-western",
    label: "Indo-Western Editorial",
    description: "Fusion fashion combining Indian and Western aesthetics",
    image: "https://images.unsplash.com/photo-1556859438-6845d3f1116e?w=600&h=600&fit=crop",
  },
  {
    id: "lifestyle-home",
    label: "Minimal Lifestyle Home",
    description: "Casual home setting with natural, lifestyle photography",
    image: "https://images.pexels.com/photos/10773467/pexels-photo-10773467.jpeg?w=600&h=600&fit=crop",
  },
];

export const CREDIT_PLANS = [
  {
    id: "trial",
    name: "Starter",
    credits: 10,
    price: 499,
    popular: false,
    label: "10 credits",
    features: [
      "10 AI generations",
      "All presets included",
      "Photo to video"
    ]
  },
  {
    id: "base",
    name: "Business",
    credits: 110,
    price: 1999,
    popular: false,
    label: "110 credits",
    features: [
      "110 AI generations",
      "All presets included",
      "Photo to video"
    ]
  },
  {
    id: "pro",
    name: "Enterprise",
    credits: 240,
    price: 3999,
    popular: true,
    label: "240 credits",
    recommended: true,
    features: [
      "240 AI generations",
      "All presets included",
      "Photo to video"
    ]
  },
];

export const FEATURES = [
  {
    title: "AI-Powered Product Photography",
    description: "Transform your jewelry into studio-quality product photos with professional lighting and pristine backgrounds",
    icon: "Sparkles",
  },
  {
    title: "Realistic Model Shots",
    description: "Showcase jewelry on authentic Indian models with natural poses and diverse skin tones",
    icon: "Camera",
  },
  {
    title: "Instant Video Conversion",
    description: "Convert generated images into stunning promotional videos perfect for Instagram and TikTok",
    icon: "Video",
  },
  {
    title: "16+ Premium Themes",
    description: "Choose from luxury studio, festive Indian, heritage temple, and modern minimal aesthetic backgrounds",
    icon: "Palette",
  },
];

export const TESTIMONIALS = [
  {
    name: "Rajesh Jewellers",
    location: "Mumbai",
    quote: "We went from 50 listings to 500+ in 2 months. Kleveer saved us ₹5 lakhs in photography costs!",
    rating: 5,
  },
  {
    name: "Meera's Gold Palace",
    location: "Bangalore",
    quote: "The model shots look incredibly real. Our online orders increased by 250% since using Kleveer.",
    rating: 5,
  },
  {
    name: "Tanishq E-Commerce Partner",
    location: "Delhi",
    quote: "Finally, professional jewelry images without studio bookings. Game changer for our e-commerce business!",
    rating: 5,
  },
];
