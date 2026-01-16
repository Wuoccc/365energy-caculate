/**
 * CẤU HÌNH HÌNH ẢNH & THÔNG SỐ ỨNG DỤNG
 * Cập nhật ngày: 16/01/2026
 * 
 * File này chứa:
 * 1. Các đường dẫn hình ảnh (GIF mô phỏng).
 * 2. Cấu hình Formspree.
 * 3. Các tham số mặc định khác.
 */

const AppConfig = {
    // --- FORMSPREE ENDPOINT ID ---
    FORMSPREE_ENDPOINT: 'xovpkqko',

    // --- CẤU HÌNH HÌNH ẢNH ---
    PLACEHOLDER_IMG: 'https://placehold.co/600x400/e0f2fe/0093d7?text=Solar+System',

    resultImages: {
        ongrid: {
            day: 'https://i.imgur.com/UasVTPC.gif',
            night: 'https://i.imgur.com/KU5UvKy.gif'
        },
        hybrid: {
            50: { // Option 1 (Standard)
                day: 'https://i.imgur.com/b1KbwmS.gif',
                night: 'https://i.imgur.com/og2oAns.gif'
            },
            70: { // Option 2 (Advanced)
                day: 'https://i.imgur.com/JQuTBa1.gif',
                night: 'https://i.imgur.com/acBHhXc.gif'
            },
            90: { // Option 3 (Premium)
                day: 'https://i.imgur.com/1L5cVim.gif',
                night: 'https://i.imgur.com/zDqk1So.gif'
            }
        }
    },

    // --- THÔNG SỐ KỸ THUẬT MẶC ĐỊNH ---
    MIN_BILL: 2000000, // Hóa đơn tối thiểu (VNĐ)
    PANEL_AREA_SQM: 2.3, // Diện tích 1 tấm pin (m2)

    // --- DỮ LIỆU NĂNG SUẤT (PVOUT) ---
    // Cập nhật hằng năm tại đây để biểu đồ chính xác hơn
    // Đơn vị: kWh/kWp/Tháng (Tháng 1 -> Tháng 12)
    PVOUT_MONTHLY_DATA: [
        123, // Tháng 1
        128, // Tháng 2
        142, // Tháng 3
        128, // Tháng 4
        112, // Tháng 5
        101, // Tháng 6
        102, // Tháng 7
        108, // Tháng 8
        100, // Tháng 9
        110, // Tháng 10
        112, // Tháng 11
        114  // Tháng 12
    ]
};
