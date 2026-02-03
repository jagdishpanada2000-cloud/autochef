// Export all services
export { authService } from './authService';
export { imageService } from './imageService';
export { restaurantService } from './restaurantService';
export { orderService } from './orderService';

// Re-export types
export type { Profile } from './authService';
export type { CloudinaryUploadResult, UploadOptions } from './imageService';
export type { Restaurant, MenuSection, MenuItem } from './restaurantService';
export type { Order, OrderItem, Payment, OrderWithItems, CreateOrderPayload } from './orderService';
