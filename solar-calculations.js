/**
 * CÁC CÔNG THỨC TÍNH TOÁN HỆ THỐNG ĐIỆN MẶT TRỜI
 * Cập nhật ngày: 16/01/2026
 * 
 * File này chứa toàn bộ logic tính toán cho:
 * 1. Hệ thống Bám tải (Ongrid)
 * 2. Hệ thống Lưu trữ (Hybrid)
 * 3. Quy đổi EVN (Tiền -> kWh và ngược lại)
 */

if (typeof evnConfig === 'undefined') {
    console.warn("evnConfig chưa được tải. Vui lòng đảm bảo evn-config.js được nhúng trước file này.");
}

const SolarCalculations = {

    /**
     * PHẦN 1: TÍNH TOÁN GIÁ ĐIỆN EVN (TIỀN <-> KWH)
     */

    /**
     * Chuyển đổi từ Số tiền thanh toán (VNĐ) sang lượng điện tiêu thụ (kWh)
     * Công thức tính ngược dựa trên biểu giá bậc thang.
     */
    convertMoneyToKWh: (moneyAmount) => {
        const vat = (typeof evnConfig !== 'undefined') ? evnConfig.vatRate : 8;
        const tiers = (typeof evnConfig !== 'undefined') ? evnConfig.tiers : [];

        if (tiers.length === 0) return 0;

        let remainingMoney = moneyAmount / (1 + vat / 100); // Trừ VAT
        let totalKWh = 0;

        for (const tier of tiers) {
            if (remainingMoney <= 0) break;

            const tierMaxCost = (tier.limit === Infinity) ? Infinity : (tier.limit * tier.price);

            if (remainingMoney >= tierMaxCost) {
                // Đủ tiền trả hết bậc này
                totalKWh += tier.limit;
                remainingMoney -= tierMaxCost;
            } else {
                // Chỉ trả được một phần bậc này
                const kwhInThisTier = remainingMoney / tier.price;
                totalKWh += kwhInThisTier;
                remainingMoney = 0;
            }
        }
        return parseFloat(totalKWh.toFixed(2));
    },

    /**
     * Tính tiền điện từ số kWh dựa trên biểu giá bậc thang EVN
     */
    calculateTieredPrice: (kWh) => {
        const vatRate = (typeof evnConfig !== 'undefined') ? (evnConfig.vatRate / 100) : 0.08;
        const tiers = (typeof evnConfig !== 'undefined') ? evnConfig.tiers : [];

        if (kWh <= 0) return { totalPreTax: 0, tax: 0, total: 0, details: [] };

        let totalPreTax = 0;
        let remaining = kWh;
        const details = [];

        tiers.forEach((tier, index) => {
            if (remaining > 0) {
                const amount = Math.min(remaining, tier.limit);
                const cost = amount * tier.price;
                totalPreTax += cost;
                remaining -= amount;
                details.push({
                    tier: index + 1,
                    price: tier.price,
                    amount: amount,
                    cost: cost
                });
            }
        });

        const tax = totalPreTax * vatRate;
        const total = totalPreTax + tax;

        return {
            totalPreTax,
            tax,
            total,
            details
        };
    },


    /**
     * PHẦN 2: TÍNH TOÁN CHUNG (SẢN LƯỢNG TIÊU THỤ)
     */

    // Diện tích một tấm pin (mặc định)
    PANEL_AREA_SQM: 2.3,

    /**
     * Tính toán phân bổ điện năng ngày/đêm
     */
    calculateConsumption: (billAmount, evnPricePerKwh, dayUsagePercent) => {
        const totalKwhPerDay = (billAmount / 30) / evnPricePerKwh;
        const dayKwh = totalKwhPerDay * (dayUsagePercent / 100);
        const nightKwh = totalKwhPerDay * (1 - (dayUsagePercent / 100));

        return { totalKwhPerDay, dayKwh, nightKwh };
    },


    /**
     * PHẦN 3: TÍNH TOÁN HỆ THỐNG BÁM TẢI (ONGRID)
     */

    calculateOngridSystem: (dayKwh, panelPowerKw, availableRoofMaxPanels = Infinity) => {
        // Công thức: Công suất lý tưởng = Nhu cầu ngày / 4 (giờ nắng trung bình?)
        // (Logic gốc trong script.js là dayKwh / 4)
        const idealCapacity = dayKwh / 4;
        let panels = Math.floor(idealCapacity / panelPowerKw);

        // Giới hạn bởi diện tích mái (nếu biết)
        panels = Math.min(panels, availableRoofMaxPanels);

        // Điều chỉnh số tấm (chia hết cho 2 hoặc 3 nếu cần, logic cũ)
        // const adjustPanelCountOngrid = (p) => (p > 0 && (p % 2 === 0 || p % 3 === 0)) ? p : p + 1;
        if (panels > 0 && panels % 2 !== 0 && panels % 3 !== 0) {
            panels += 1;
        }

        // Kiểm tra lại với mái sau khi điều chỉnh
        if (panels > availableRoofMaxPanels) panels = availableRoofMaxPanels;

        const capacity = panels * panelPowerKw;
        const roofArea = panels * SolarCalculations.PANEL_AREA_SQM;

        return {
            panels,
            capacity,
            roofArea,
            isValid: capacity >= 3 // Min capacity 3kWp assumption from script.js
        };
    },

    /**
     * Tính tiền tiết kiệm Ongrid (tạm tính: công suất * 4h * giá điện * 30 ngày)
     */
    calculateOngridSavings: (capacity, evnPrice) => {
        const raw = capacity * 4 * evnPrice * 30;
        // Làm tròn (Logic gốc: roundSavingAmount)
        // < 500k -> 500k. else floor(x/500k)*500k
        if (raw < 500000) return 500000;
        return Math.floor(raw / 500000) * 500000;
    },


    /**
     * PHẦN 4: TÍNH TOÁN HỆ THỐNG HỖN HỢP (HYBRID)
     */

    /**
     * Tính toán một phương án Hybrid cụ thể (50%, 70%, 90% nhu cầu đêm)
     */
    calculateHybridPackage: (
        levelPercent, // 50, 70, 90
        nightKwh,
        ongridCapacity, // Công suất nền từ hệ bám tải
        panelPowerKw,
        availableRoofMaxPanels = Infinity
    ) => {
        // Nhu cầu lưu trữ mục tiêu
        const maxStorageCapacity = nightKwh / 4; // Logic gốc
        const targetStorageForLevel = maxStorageCapacity * (levelPercent / 100);

        // Tổng công suất mục tiêu = Bám tải + Lưu trữ
        const totalTargetCapacity = ongridCapacity + targetStorageForLevel;

        let idealPanels = Math.floor(totalTargetCapacity / panelPowerKw);
        let panels = Math.min(idealPanels, availableRoofMaxPanels);

        const capacity = panels * panelPowerKw;
        const roofArea = panels * SolarCalculations.PANEL_AREA_SQM;

        // Tính số lượng Pack Pin (Battery)
        // CÔNG THỨC: (Phần dư ra so với Ongrid * 4 giờ * hiệu suất 0.9)
        const additionalCapacity = capacity - ongridCapacity;
        const bessEnergyCovered = (additionalCapacity > 0 ? additionalCapacity : 0) * 4 * 0.9;
        const bessPacks = Math.round(bessEnergyCovered / 5);

        return {
            level: levelPercent,
            panels,
            capacity,
            roofArea,
            packs: bessPacks,
            isValid: (capacity >= 3 && bessPacks > 0 && capacity > ongridCapacity) // Logic gốc
        };
    },

    /**
     * Tính tiền tiết kiệm Hybrid (tạm tính tương tự Ongrid)
     */
    calculateHybridSavings: (capacity, evnPrice) => {
        const raw = capacity * 4 * evnPrice * 30;
        if (raw < 500000) return 500000;
        return Math.floor(raw / 500000) * 500000;
    },

    /**
     * PHẦN 5: TÍNH TOÁN BIỂU ĐỒ TIẾT KIỆM (BACK-CALCULATION)
     * Input: Tiền điện khách nhập (VNĐ), Công suất hệ thống (kWp)
     */
    calculateMonthlySavingsPattern: function (tienDienKhachNhap, congSuatHeThong) {
        // 1. DỮ LIỆU ĐẦU VÀO CỦA 365 ENERGY (PVOUT kWh/kWp/Tháng)
        // Lấy từ file cấu hình app-config.js để dễ dàng cập nhật hằng năm
        const duLieuNangThang = (typeof AppConfig !== 'undefined' && AppConfig.PVOUT_MONTHLY_DATA)
            ? AppConfig.PVOUT_MONTHLY_DATA
            : [123, 128, 142, 128, 112, 101, 102, 108, 100, 110, 112, 114]; // Fallback nếu lỗi config

        // 2. TÍNH TỔNG NHU CẦU ĐIỆN (kWh) TỪ TIỀN
        let tongNhuCauKWh = this.convertMoneyToKWh(tienDienKhachNhap);

        let duLieuBieuDo = [];     // Để vẽ biểu đồ cột xanh
        let duLieuChiTiet = [];    // Để hiện bảng số liệu (nếu cần sau này)

        // 3. CHẠY VÒNG LẶP 12 THÁNG
        for (let i = 0; i < 12; i++) {
            // A. Tính sản lượng Solar tháng đó
            // Công thức: Công suất hệ thống * PVOUT tháng
            let sanLuongSolar = congSuatHeThong * duLieuNangThang[i];

            // B. Tính lượng điện còn phải mua của EVN
            // Nếu Solar sinh nhiều hơn nhu cầu -> Mua 0 kWh
            let dienMuaLuoi = Math.max(0, tongNhuCauKWh - sanLuongSolar);

            // C. Tính tiền điện MỚI (Sau khi có Solar)
            // Dùng hàm tính giá bậc thang có sẵn
            let ketQuaTienMoi = this.calculateTieredPrice(dienMuaLuoi);
            let tienDienMoi = ketQuaTienMoi.total; // Tổng tiền sau thuế

            // D. Tính TIỀN TIẾT KIỆM (Đây là con số vẽ lên biểu đồ)
            // Logic: Lấy tiền cũ trừ tiền mới
            let tienTietKiem = tienDienKhachNhap - tienDienMoi;

            // Lưu vào mảng
            duLieuBieuDo.push(Math.round(tienTietKiem));

            duLieuChiTiet.push({
                thang: i + 1,
                sanLuongSolar: sanLuongSolar,
                tietKiem: tienTietKiem
            });
        }

        return {
            chartData: duLieuBieuDo, // Mảng dùng cho Chart.js
            tableData: duLieuChiTiet
        };
    }

};

window.SolarCalculations = SolarCalculations; // Globa export
