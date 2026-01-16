/**
 * CẤU HÌNH GIÁ ĐIỆN BẬC THANG EVN
 * Cập nhật ngày: 16/01/2026
 * 
 * Để cập nhật giá điện, bạn chỉ cần thay đổi các số ở cột 'price'.
 * 'limit': Số kWh tối đa của bậc đó (50, 100, Infinity...).
 * 'price': Giá tiền cho mỗi kWh ở bậc đó (VNĐ).
 */

const evnConfig = {
    vatRate: 8, // Thuế VAT (%)
    tiers: [
        { limit: 50, price: 1984 },       // Bậc 1: 0 - 50 kWh
        { limit: 50, price: 2050 },       // Bậc 2: 51 - 100 kWh
        { limit: 100, price: 2380 },      // Bậc 3: 101 - 200 kWh
        { limit: 100, price: 2998 },      // Bậc 4: 201 - 300 kWh
        { limit: 100, price: 3350 },      // Bậc 5: 301 - 400 kWh
        { limit: Infinity, price: 3460 }  // Bậc 6: 401 kWh trở lên
    ]
};
