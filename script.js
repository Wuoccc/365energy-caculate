document.addEventListener('DOMContentLoaded', async () => { // Thêm async

    // --- DATA & CONFIG LOADED FROM EXTERNAL FILES ---
    // translations.js -> AppTranslations
    // app-config.js -> AppConfig

    // --- STATE & CONFIGURATION ---
    let currentTranslations = {};
    let calculationState = {};
    let selectedResult = null;
    const formatter = new Intl.NumberFormat('vi-VN');
    let savingsChartInstance = null; // Chart instance variable

    // Helper to get image or fallback

    // Helper to get image or fallback
    const getImage = (type, subType, time) => {
        try {
            if (type === 'ongrid') return AppConfig.resultImages.ongrid[time] || AppConfig.PLACEHOLDER_IMG;
            if (type === 'hybrid') return AppConfig.resultImages.hybrid[subType][time] || AppConfig.PLACEHOLDER_IMG;
        } catch (e) { return AppConfig.PLACEHOLDER_IMG; }
        return AppConfig.PLACEHOLDER_IMG;
    };

    // --- DOM ELEMENTS ---
    const ui = {
        form: document.getElementById('solar-form'),
        resultsSection: document.getElementById('results-section'),
        billInput: document.getElementById('bill'),
        dayUsageSlider: document.getElementById('day-usage-slider'), // Changed
        dayUsageValue: document.getElementById('day-usage-value'),   // Added
        regionSelect: document.getElementById('region-select'), // Changed
        roofChoiceOptions: document.getElementById('roof-choice-options'), // Added
        roofAreaInputWrapper: document.getElementById('roof-area-input-wrapper'), // Added
        roofAreaInput: document.getElementById('roof-area-input'), // Added
        panelPowerInput: document.getElementById('panel-power'),
        priceTypeOptions: document.getElementById('price-type-options'),
        hiddenPriceType: document.getElementById('price-type'),
        errorMessage: document.getElementById('error-message'),
        maxPacksDisplay: document.getElementById('max-packs-display'), // Added
        panelPackInfo: document.getElementById('panel-pack-info'), // Added ID for the container
        langSwitcher: {
            container: document.getElementById('language-switcher-container'),
            button: document.getElementById('language-switcher-button'),
            menu: document.getElementById('language-switcher-menu'),
            text: document.getElementById('selected-lang-text'),
            img: document.getElementById('language-switcher-button').querySelector('img')
        },
        resultToggle: {
            slider: document.getElementById('result-toggle-slider'),
            optionOngrid: document.getElementById('toggle-option-ongrid'),
            optionHybrid: document.getElementById('toggle-option-hybrid'),
            toggle: document.getElementById('result-toggle')
        },
        results: {
            ongrid: document.getElementById('ongrid-results'),
            hybrid: document.getElementById('hybrid-results'),
            hybridSingle: document.getElementById('hybrid-result-single'),
            hybridMultiHeader: document.getElementById('hybrid-multi-header'), // Added
            hybridGrid: document.getElementById('hybrid-package-grid'),
            ongridRoofAreaWrapper: document.getElementById('ongrid-roof-area-wrapper'), // Added
            hybridSingleRoofAreaWrapper: document.getElementById('hybrid-single-roof-area-wrapper'), // Added
            hybridRoofAreaWrappers: { // Added
                50: document.getElementById('hybrid-roof-area-50-wrapper'),
                70: document.getElementById('hybrid-roof-area-70-wrapper'),
                90: document.getElementById('hybrid-roof-area-90-wrapper')
            }
        },
        // Image elements
        ongridResultImage: document.getElementById('ongrid-result-image'),
        hybridSingleImage: document.getElementById('hybrid-single-image'),
        hybridImage50: document.getElementById('hybrid-image-50'),
        hybridImage70: document.getElementById('hybrid-image-70'),
        hybridImage90: document.getElementById('hybrid-image-90'),

        confirmButtonContainer: document.getElementById('confirm-button-container'),
        confirmButton: document.getElementById('confirm-button'),
        toast: document.getElementById('toast-notification'), // Added toast
        popup: {
            overlay: document.getElementById('contact-popup'),
            content: document.querySelector('.popup-content'),
            closeButton: document.getElementById('close-popup'),
            form: document.getElementById('contact-form'),
            nameInput: document.getElementById('popup-name'), // Added
            phoneInput: document.getElementById('popup-phone'),
            phoneError: document.getElementById('phone-error'),
            submitButton: document.getElementById('submit-popup'),
            selectedSystemInput: document.getElementById('selected-system-info'),
            popupErrorMessage: document.getElementById('popup-error-message'), // Added
            // New Image Popup elements
            imageOverlay: document.getElementById('image-popup-overlay'),
            imageContent: document.getElementById('popup-image'),
            closeImageButton: document.getElementById('close-image-popup')
        },
        savingsChartCanvas: document.getElementById('savings-chart') // Added chart canvas
    };

    // --- FUNCTIONS ---

    /**
            "main_title": "Ước tính công suất điện mặt trời",
            "hero_subtitle": "Tính toán nhanh chóng hiệu quả đầu tư và cấu hình hệ thống phù hợp nhất với nhu cầu sử dụng điện của bạn.",
            "form_title": "Nhập thông tin tiêu thụ",
            "bill_label": "Hóa đơn tiền điện hàng tháng",
            "bill_hint": "Nhập số tiền trung bình bạn trả mỗi tháng.",
            "bill_placeholder": "Ví dụ: 2.000.000",
            "price_type_label": "Loại giá điện",
            "price_type_residential": "Sinh hoạt",
            "price_type_business": "Kinh doanh",
            "day_usage_label": "Tỷ lệ sử dụng điện ban ngày",
            "day_usage_desc": "Phần trăm điện năng bạn dùng từ 6h sáng đến 6h chiều.",
            "day_usage_placeholder": "Ví dụ: 70",
            "region_label": "Khu vực",
            "region_placeholder": "Vui lòng chọn khu vực",
            "know_roof_area_label": "Bạn có biết diện tích mái?",
            "option_yes": "Đã biết",
            "option_no": "Không rõ",
            "roof_area_input_label": "Nhập diện tích mái (m²)",
            "roof_area_input_placeholder": "Ví dụ: 50",
            "panel_power_label": "Công suất tấm pin (W)",
            "panel_power_placeholder": "Ví dụ: 590",
            "max_packs_label": "Pack tối đa (ước tính)",
            "calculate_button": "Tính toán ngay",
            "results_title": "Kết quả ước tính dành cho bạn",
            "consumption_analysis_title": "Sản lượng tiêu thụ",
            "day_consumption_label": "Ban ngày",
            "night_consumption_label": "Ban đêm",
            "ongrid_title": "Hệ thống Hoà lưới bám tải",
            "ongrid_explanation": "Hệ thống chuyển đổi quang năng thành điện năng cung cấp trực tiếp cho các thiết bị điện, giảm lượng điện tiêu thụ từ lưới vào ban ngày.",
            "hybrid_title": "Hệ thống lưu trữ (Hybrid)",
            "hybrid_explanation": "Hệ thống kết hợp pin lưu trữ để sử dụng điện năng lượng mặt trời vào ban đêm hoặc khi mất điện.",
            "ongrid_title_short": "Bám tải",
            "ongrid_desc": "Tiết kiệm điện ban ngày",
            "hybrid_title_short": "Lưu trữ",
            "hybrid_desc": "Có pin lưu trữ (Ban đêm)",
            "system_capacity": "Công suất hệ thống",
            "savings_label": "Tiết kiệm dự kiến",
            "month_unit": "tháng",
            "payback_label": "Thời gian hoàn vốn",
            "years_unit": "năm",
            "hybrid_option_1": "Tiêu chuẩn",
            "hybrid_option_2": "Nâng cao",
            "hybrid_option_3": "Cao cấp",
            "roof_area_label": "Diện tích mái tối thiểu",
            "bess_packs_label": "Số Pack Pin",
            "confirm_button": "Đăng ký Tư vấn Ngay",
            "cta_title": "Bạn đã hài lòng với phương án này?",
            "cta_desc": "Hãy để các kỹ sư của 365 Energy khảo sát thực tế và tư vấn chuyên sâu cho bạn. Hoàn toàn miễn phí!",
            "benefit_1": "Khảo sát tận nơi",
            "benefit_2": "Báo giá chi tiết",
            "popup_title": "Đăng ký tư vấn",
            "hotline_label": "Hotline: 1900 0250",
            "footer_slogan": "Tiên phong kiến tạo giải pháp năng lượng xanh bền vững cho người Việt.",
            "footer_quick_links": "Liên kết nhanh",
            "footer_contact": "Liên hệ",
            "footer_address": "45 Đường số 2, P. Trường Thọ, TP. Thủ Đức, TP. HCM",
            "footer_copyright": "Bản quyền © 2025 365 Energy. All rights reserved.",
            "popup_name_label": "Họ và Tên",
            "popup_phone_label": "Số điện thoại",
            "popup_phone_error": "Vui lòng chỉ nhập số.",
            "popup_phone_error_format": "Vui lòng nhập SĐT 10 số, bắt đầu bằng 0.",
            "popup_submit_button": "Gửi Đăng Ký",
            "popup_submitting_button": "Đang gửi...",
            "toast_message": "Gửi thông tin thành công!",
            "popup_error_message": "Gửi thất bại. Vui lòng thử lại sau.",
            "error_invalid_bill": "Vui lòng nhập hóa đơn tiền điện hợp lệ.",
            "error_bill_too_low": "Hóa đơn tiền điện phải từ 2.000.000đ trở lên.",
            "error_invalid_usage": "Vui lòng nhập tỷ lệ sử dụng từ 10 đến 100.",
            "error_invalid_panel": "Công suất tấm pin phải là một số lớn hơn 0.",
            "error_region_invalid": "Vui lòng chọn khu vực.",
            "error_roof_area_invalid": "Vui lòng nhập diện tích mái hợp lệ (lớn hơn 0).",
            "error_no_valid_system": "Hệ thống không khả dụng",
            "results_disclaimer": "* Số liệu chỉ mang tính tham khảo."
        },
        en: {
            "main_title": "SOLAR POWER CAPACITY ESTIMATOR",
            "hero_subtitle": "Quickly calculate investment efficiency and the best system configuration for your needs.",
            "form_title": "Enter Consumption Info",
            "bill_label": "Monthly Electricity Bill",
            "bill_hint": "Enter the average amount you pay per month.",
            "bill_placeholder": "Example: 2,000,000",
            "price_type_label": "Price Type",
            "price_type_residential": "Residential",
            "price_type_business": "Business",
            "day_usage_label": "Daytime Usage Rate",
            "day_usage_desc": "Percentage of electricity used from 6 AM to 6 PM.",
            "day_usage_placeholder": "Example: 70",
            "region_label": "Region",
            "region_placeholder": "Please select a region",
            "know_roof_area_label": "Do you know your roof area?",
            "option_yes": "Yes",
            "option_no": "Not sure",
            "roof_area_input_label": "Enter roof area (m²)",
            "roof_area_input_placeholder": "Example: 50",
            "panel_power_label": "Panel Power (W)",
            "panel_power_placeholder": "Example: 590",
            "max_packs_label": "Max Est. Packs",
            "calculate_button": "Calculate Now",
            "results_title": "Your Estimated Results",
            "consumption_analysis_title": "Consumption Analysis",
            "day_consumption_label": "Daytime",
            "night_consumption_label": "Nighttime",
            "ongrid_title": "Ongrid System",
            "ongrid_explanation": "Conversion of solar energy directly for appliances, reducing grid consumption during the day.",
            "hybrid_title": "Hybrid Storage System",
            "hybrid_explanation": "Combines solar with battery storage for use at night or during power outages.",
            "ongrid_title_short": "Ongrid",
            "ongrid_desc": "Save day electricity",
            "hybrid_title_short": "Hybrid",
            "hybrid_desc": "Has battery (Night)",
            "system_capacity": "System Capacity",
            "savings_label": "Est. Savings",
            "month_unit": "month",
            "payback_label": "Payback Period",
            "years_unit": "years",
            "hybrid_option_1": "Standard",
            "hybrid_option_2": "Advanced",
            "hybrid_option_3": "Premium",
            "roof_area_label": "Min Roof Area",
            "bess_packs_label": "Battery Packs",
            "confirm_button": "Register Now",
            "cta_title": "Satisfied with this estimate?",
            "cta_desc": "Let our engineers conduct a site survey and provide a detailed quotation. Completely free!",
            "benefit_1": "Site Survey",
            "benefit_2": "Detailed Quote",
            "popup_title": "Register for Consultation",
            "hotline_label": "Hotline: 1900 0250",
            "footer_slogan": "Pioneering sustainable green energy solutions for Vietnam.",
            "footer_quick_links": "Quick Links",
            "footer_contact": "Contact Us",
            "footer_address": "45 Street No. 2, Truong Tho Ward, Thu Duc City, HCMC",
            "footer_copyright": "Copyright © 2025 365 Energy. All rights reserved.",
            "popup_name_label": "Full Name",
            "popup_phone_label": "Phone Number",
            "popup_phone_error": "Please enter numbers only.",
            "popup_phone_error_format": "Please enter a 10-digit phone number, starting with 0.",
            "popup_submit_button": "Submit Registration",
            "popup_submitting_button": "Sending...",
            "toast_message": "Information sent successfully!",
            "popup_error_message": "Submission failed. Please try again later.",
            "error_invalid_bill": "Please enter a valid electricity bill.",
            "error_bill_too_low": "Electricity bill must be 2,000,000 VND or higher.",
            "error_invalid_usage": "Please enter a usage rate between 10 and 100.",
            "error_invalid_panel": "Panel power must be a number greater than 0.",
            "error_region_invalid": "Please select a region.",
            "error_roof_area_invalid": "Please enter a valid roof area (greater than 0).",
            "error_no_valid_system": "System not available",
            "results_disclaimer": "* Figures are for reference only."
        }
    };

    /**
     * (UPDATED) Switch language using embedded data.
     * @param {string} lang - The language to switch to ('vi' or 'en').
     */
    const switchLanguage = (lang) => {
        currentTranslations = AppTranslations[lang];
        document.documentElement.lang = lang;

        // Update text based on 'currentTranslations'
        document.querySelectorAll('[data-translate]').forEach(el => {
            const key = el.getAttribute('data-translate');
            if (currentTranslations[key]) el.textContent = currentTranslations[key];
        });

        document.querySelectorAll('[data-translate-placeholder]').forEach(el => {
            const key = el.getAttribute('data-translate-placeholder');
            if (currentTranslations[key]) el.placeholder = currentTranslations[key];
        });

        ui.langSwitcher.text.textContent = lang === 'vi' ? 'VN' : 'EN';
        ui.langSwitcher.img.src = lang === 'vi' ? 'https://imgur.com/6jPr7xK.png' : 'https://imgur.com/uC9LHVh.png';
        ui.langSwitcher.menu.classList.add('hidden');
    };

    /**
    * (Đã cập nhật) Validates form inputs and returns a boolean and error message.
    * @returns {{isValid: boolean, errorKey: string|null}}
    */
    const validateInputs = () => {
        const bill = parseFloat(ui.billInput.value.replace(/\./g, ''));
        const dayUsage = parseFloat(ui.dayUsageSlider.value); // Read from slider
        const panelPower = parseFloat(ui.panelPowerInput.value);
        const region = ui.regionSelect.value; // Updated to regionSelect
        const knowsRoof = ui.roofChoiceOptions.querySelector('.selected').dataset.roofChoice === 'yes';

        if (isNaN(bill) || bill < AppConfig.MIN_BILL) return { isValid: false, errorKey: 'error_bill_too_low' }; // Check minimum bill
        if (!region) return { isValid: false, errorKey: 'error_region_invalid' }; // Updated region check

        if (knowsRoof) { // Added validation for roof area
            const roofArea = parseFloat(ui.roofAreaInput.value);
            if (isNaN(roofArea) || roofArea <= 0) return { isValid: false, errorKey: 'error_roof_area_invalid' };
        }

        if (isNaN(panelPower) || panelPower <= 0) return { isValid: false, errorKey: 'error_invalid_panel' };

        return { isValid: true, errorKey: null };
    };

    /**
     * Switches the result view between 'ongrid' and 'hybrid'.
     * @param {string} type - 'ongrid' or 'hybrid'.
     */
    const switchResultView = (type) => {
        const { slider, optionOngrid, optionHybrid } = ui.resultToggle;
        if (type === 'ongrid') {
            slider.classList.remove('slide-right');
            optionOngrid.classList.add('selected');
            optionHybrid.classList.remove('selected');
            ui.results.ongrid.classList.remove('hidden');
            ui.results.hybrid.classList.add('hidden');
        } else {
            slider.classList.add('slide-right');
            optionOngrid.classList.remove('selected');
            optionHybrid.classList.add('selected');
            ui.results.ongrid.classList.add('hidden');
            ui.results.hybrid.classList.remove('hidden');
        }
        clearResultSelection();
    };

    /**
    * Clears the selected state from all result cards and hides the confirm button.
    */
    const clearResultSelection = () => {
        const highlightClasses = ['transform', 'md:-translate-y-4', 'shadow-xl', 'border-blue-200', 'ring-2', 'ring-blue-500', 'z-10'];

        document.querySelectorAll('.result-card').forEach(card => {
            card.classList.remove('result-selected');

            if (card.dataset.resultType === 'hybrid') {
                // Remove highlight classes from ALL cards first (Make them FLAT/Equal Height)
                card.classList.remove(...highlightClasses);

                // Ensure all are visible
                // card.classList.remove('hidden'); // REMOVED: Do not unhide unconditionally
                card.classList.remove('col-span-3', 'max-w-4xl', 'mx-auto', 'expanded', 'md:flex-row', 'md:items-center', 'md:gap-12');
                card.classList.add('md:max-w-xs');

                // Clean up images just in case
                const imgWrapper = card.querySelector('.relative.mt-6') || card.querySelector('.relative');
                if (imgWrapper) {
                    imgWrapper.classList.remove('aspect-w-16', 'aspect-h-9', 'w-full', 'md:w-1/2');
                }
                const img = card.querySelector('img');
                if (img) {
                    img.className = 'rounded-lg w-full h-48 md:h-56 object-cover bg-gray-100 shadow-sm';
                }
                const infoDiv = card.children[1];
                if (infoDiv) infoDiv.classList.remove('w-full', 'md:w-1/2');

                // Remove close button
                const closeBtn = card.querySelector('.close-card-btn');
                if (closeBtn) closeBtn.remove();
            }
        });

        // Ensure grid visibility
        const hybridGrid = document.getElementById('hybrid-package-grid');
        if (hybridGrid) {
            hybridGrid.querySelectorAll('.result-card').forEach(c => {
                if (c.dataset.resultDetails) c.classList.remove('hidden');
            });
        }

        selectedResult = null;
        ui.confirmButtonContainer.classList.add('hidden');
    };

    /**
     * Resets the Hybrid view to the 3-column list.
     */
    const resetHybridView = (e) => {
        if (e) e.stopPropagation();
        clearResultSelection();
        // Ensure we stay on hybrid view if that was active
        const hybridOption = document.querySelector('.toggle-switch-option[data-type="hybrid"]');
        if (hybridOption && !hybridOption.classList.contains('disabled')) {
            // Just to be sure visuals are correct
        }
    };

    /**
     * Handles the selection of a result card.
     * Logic:
     * - Hybrid: 1st click -> Expand & Highlight (Hide siblings). 2nd click -> Show CTA.
     * - Ongrid: Click -> Highlight & Show Show CTA (or follow same 2-step if desired, but applying to Hybrid as requested).
     * @param {Event} event - The click event.
     */
    const handleResultSelection = (event) => {
        const clickedCard = event.currentTarget;
        const resultType = clickedCard.dataset.resultType;
        const highlightClasses = ['transform', 'md:-translate-y-4', 'shadow-xl', 'border-blue-200', 'ring-2', 'ring-blue-500', 'z-10'];

        if (clickedCard === selectedResult) {
            // Already selected.
            // Requirement: "Selected -> Highlighted". 
            // "Press 2nd time" logic for CTA
            if (ui.confirmButtonContainer.classList.contains('hidden')) {
                ui.confirmButtonContainer.classList.remove('hidden');
                ui.confirmButtonContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                // Optional: Click 3rd time prevents toggle/close?
                // Or maybe allow deselecting?
                // For now, just keep showing CTA.
            }
        } else {
            // New selection - Reset others first
            document.querySelectorAll('.result-card').forEach(card => card.classList.remove('result-selected'));

            selectedResult = clickedCard;
            clickedCard.classList.add('result-selected');

            // Show CTA immediately
            ui.confirmButtonContainer.classList.remove('hidden');
            // Optional: Auto scroll to CTA if it's far down?
            // ui.confirmButtonContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            // User just said "hiện", not necessarily scroll aggressively, but let's leave scroll consistent if desired.
            // Keeping it simple as "visible" for now.

            if (resultType === 'hybrid') {
                // Hybrid Logic: Pop Selected, Flatten Others
                const allHybridCards = document.getElementById('hybrid-package-grid').querySelectorAll('.result-card');

                allHybridCards.forEach(card => {
                    // Always unhide siblings (ensure grid view)
                    if (card.dataset.resultDetails) card.classList.remove('hidden');

                    if (card === clickedCard) {
                        // Add Highlight
                        card.classList.add(...highlightClasses);
                    } else {
                        // Remove Highlight (Push down)
                        card.classList.remove(...highlightClasses);
                    }
                });

                // Ensure Header is HIDDEN when a card is selected (Detailed View)
                // Wait, user said "When there is only 1 option".
                // If there's only 1 option, `hybrid-result-single` is usually used?
                // Let's check calculation logic.


            } else {
                // Ongrid Logic - already shown above
            }
            // --- UPDATE CHART ---
            if (clickedCard.dataset.resultDetails) {
                try {
                    const details = JSON.parse(clickedCard.dataset.resultDetails);

                    // Get current Bill Input
                    const billInputRaw = ui.billInput.value.replace(/\./g, '');
                    const billAmount = parseFloat(billInputRaw);
                    const capacity = parseFloat(details.capacity);

                    if (!isNaN(billAmount) && !isNaN(capacity)) {
                        // Use External Manager
                        if (window.SavingsChartManager) {
                            SavingsChartManager.updateChart(ui.savingsChartCanvas, billAmount, capacity);

                            // Auto-scroll to Chart (User Request)
                            setTimeout(() => {
                                const chartCard = ui.savingsChartCanvas.closest('.card');
                                if (chartCard) {
                                    chartCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                }
                            }, 100);
                        }
                    }
                } catch (e) {
                    console.error("Error updating chart:", e);
                }
            }
        }
    };

    /**
     * Updates the savings chart using the detailed back-calculation logic.
     * @param {number} billAmount - The user's monthly electricity bill (VNĐ).
     * @param {number} systemCapacity - The system capacity (kWp).
     */
    const updateSavingsChart = (billAmount, systemCapacity) => {
        if (!ui.savingsChartCanvas) return;

        // 1. Calculate Data using the new detailed logic
        const calculationResult = SolarCalculations.calculateMonthlySavingsPattern(billAmount, systemCapacity);
        const data = calculationResult.chartData;

        // 2. Generate Labels (Current Year)
        const now = new Date();
        const currentYear = now.getFullYear();

        const labels = [];
        for (let i = 1; i <= 12; i++) {
            labels.push(`Tháng ${i}/${currentYear}`);
        }

        // Destroy old chart
        if (savingsChartInstance) {
            savingsChartInstance.destroy();
        }

        // Create new Chart
        const ctx = ui.savingsChartCanvas.getContext('2d');

        // Chart Config
        savingsChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tiền điện tiết kiệm (VNĐ)',
                    data: data,
                    backgroundColor: '#34d399', // var(--brand-green) approx
                    borderRadius: 4,
                    hoverBackgroundColor: '#4ade80'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#1f2937', // Dark gray
                            font: { family: 'Montserrat', size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                return formatter.format(context.raw) + ' VNĐ';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)' // Subtle light gray grid
                        },
                        ticks: {
                            color: '#4b5563', // Gray 600
                            font: { family: 'Montserrat', size: 10 },
                            callback: function (value) {
                                if (value >= 1000000) return (value / 1000000) + 'tr';
                                return formatter.format(value);
                            }
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#4b5563', // Gray 600
                            font: { family: 'Montserrat', size: 10 },
                            maxRotation: 45,
                            minRotation: 0
                        },
                        border: { display: false }
                    }
                }
            }
        });
    };

    /**
     * (Đã cập nhật) Opens the contact popup.
     */
    const openPopup = () => {
        if (!selectedResult) return;

        const region = ui.regionSelect.value; // Get region value
        const knowsRoof = ui.roofChoiceOptions.querySelector('.selected').dataset.roofChoice === 'yes';
        // Store selected system info in hidden input
        const systemType = selectedResult.dataset.resultType;
        const details = JSON.parse(selectedResult.dataset.resultDetails || '{}');
        let infoString = `Khu vực: ${region}\nLoại hệ thống: ${systemType}`; // Add region
        if (details.option) { // Use option number if available
            infoString += `\nPhương án: ${details.option}`;
        }
        // Add more details from the dataset
        if (details.capacity) infoString += `\nCông suất: ${details.capacity} kWp`;
        if (details.saving) infoString += `\nTiết kiệm: ${formatter.format(details.saving)} VND/tháng`; // Format saving
        if (details.packs) infoString += `\nSố pack: ${details.packs}`;

        if (knowsRoof) { // If user provided roof area
            infoString += `\nDiện tích mái (đã nhập): ${ui.roofAreaInput.value} m²`;
        } else if (details.roofArea) { // If we calculated it
            infoString += `\nDiện tích mái (ước tính): ${details.roofArea} m²`; // Add roof area
        }

        ui.popup.selectedSystemInput.value = infoString;

        ui.popup.overlay.classList.add('active');
    };

    /**
     * Closes the contact popup.
     */
    const closePopup = () => {
        ui.popup.overlay.classList.remove('active');
        document.getElementById('contact-form').reset();
        ui.popup.phoneError.classList.add('hidden');
        ui.popup.popupErrorMessage.textContent = ''; // Clear error message on close
    };

    /**
    * Opens the image popup with a specific image source.
    * @param {string} src - The URL of the image to display.
    */
    const openImagePopup = (src) => {
        ui.popup.imageContent.src = src;
        ui.popup.imageOverlay.classList.add('active');
    };

    /**
     * Closes the image popup.
     */
    const closeImagePopup = () => {
        ui.popup.imageOverlay.classList.remove('active');
        ui.popup.imageContent.src = ""; // Clear src to stop loading/gif
    };

    /**
     * Formats the pack count to always have two digits.
     * @param {number} count - The number of packs.
     * @returns {string} - The formatted pack count string.
     */
    const formatPackCount = (count) => {
        const safeCount = Math.max(0, count);
        return String(safeCount).padStart(2, '0');
    };

    /**
     * Rounds the saving amount based on the specified rules.
     * @param {number} amount - The calculated saving amount.
     * @returns {number} - The rounded saving amount.
     */
    const roundSavingAmount = (amount) => {
        if (amount < 500000) {
            return 500000;
        } else {
            return Math.floor(amount / 500000) * 500000;
        }
    };

    /**
     * Maps the original level (50, 70, 90) to the display option number (1, 2, 3)
     * based on the filtered and sorted list.
     * @param {number} level - The original level (50, 70, 90).
     * @param {Array} filteredPackages - The final list of packages to display.
     * @returns {number} - The display option number (1, 2, or 3).
     */
    const mapLevelToOptionNumber = (level, filteredPackages) => {
        const index = filteredPackages.findIndex(pkg => pkg.level === level);
        return index + 1; // Return 1-based index
    };

    /**
     * (Đã cập nhật) Recalculates everything based on form inputs.
     */
    const calculateAndDisplayResults = () => {
        ui.errorMessage.textContent = '';
        clearResultSelection();

        const { isValid, errorKey } = validateInputs();
        if (!isValid) {
            ui.errorMessage.textContent = currentTranslations[errorKey]; // Cập nhật
            ui.resultsSection.classList.add('hidden');
            return;
        }

        const bill = parseFloat(ui.billInput.value.replace(/\./g, ''));
        const evnPrice = parseFloat(ui.hiddenPriceType.value);
        const dayUsage = parseFloat(ui.dayUsageSlider.value);
        const dayUsagePercent = dayUsage / 100;
        const panelPower = parseFloat(ui.panelPowerInput.value);
        const panelPowerKw = panelPower / 1000;
        const knowsRoof = ui.roofChoiceOptions.querySelector('.selected').dataset.roofChoice === 'yes'; // Get roof choice
        const roofAreaInputValue = parseFloat(ui.roofAreaInput.value);

        // Determine max panels from roof if specified
        let maxPanelsFromRoof = Infinity;
        if (knowsRoof && !isNaN(roofAreaInputValue) && roofAreaInputValue > 0) {
            maxPanelsFromRoof = Math.floor(roofAreaInputValue / SolarCalculations.PANEL_AREA_SQM);
        }

        // 1. Calculate Consumption
        const consumption = SolarCalculations.calculateConsumption(bill, evnPrice, dayUsage);
        const { dayKwh, nightKwh } = consumption;
        const timeOfDay = (dayKwh >= nightKwh) ? 'day' : 'night';

        const maxPacks = Math.floor(nightKwh / 5);
        ui.maxPacksDisplay.textContent = formatPackCount(maxPacks);

        // 2. Calculate Ongrid System
        const ongridResult = SolarCalculations.calculateOngridSystem(dayKwh, panelPowerKw, maxPanelsFromRoof);

        // Calculate Savings for Ongrid
        const ongridSaving = SolarCalculations.calculateOngridSavings(ongridResult.capacity, evnPrice);

        const isOngridValid = ongridResult.isValid && ongridResult.capacity >= 3; // Ensure local min 3kwp check

        // Store calculations
        calculationState = {
            evnPrice, dayKwh, nightKwh,
            ongrid: {
                capacity: ongridResult.capacity,
                saving: ongridSaving,
                roofArea: ongridResult.roofArea
            },
            hybrid: {}
        };

        // 3. Calculate Hybrid Systems
        let validHybridPackages = [];

        [50, 70, 90].forEach(level => {
            const hybridPkg = SolarCalculations.calculateHybridPackage(
                level,
                nightKwh,
                ongridResult.capacity, // Base on Ongrid capacity
                panelPowerKw,
                maxPanelsFromRoof
            );

            // Calculate Savings for Hybrid
            const hybridSaving = SolarCalculations.calculateHybridSavings(hybridPkg.capacity, evnPrice);


            // Validate Hybrid Package
            if (hybridPkg.isValid && hybridPkg.capacity >= 3 && hybridPkg.capacity > ongridResult.capacity) {
                const packageData = {
                    level: level,
                    capacity: hybridPkg.capacity,
                    saving: hybridSaving,
                    packs: hybridPkg.packs,
                    roofArea: hybridPkg.roofArea
                };
                calculationState.hybrid[level] = packageData;
                validHybridPackages.push(packageData);
            } else {
                calculationState.hybrid[level] = null;
            }
        });

        // Filter Hybrid packages (Same logic: Unique packs preferred, usually handled by UI logic)
        // Logic: Keep highest level for same pack count? Original logic: 
        // "sort by level desc -> if packs not seen -> push". This keeps highest level for a pack count.
        const filteredHybridPackages = [];
        const packCountMap = {};
        validHybridPackages.sort((a, b) => b.level - a.level);
        validHybridPackages.forEach(pkg => {
            if (!packCountMap[pkg.packs]) {
                filteredHybridPackages.push(pkg);
                packCountMap[pkg.packs] = pkg.level;
            }
        });
        filteredHybridPackages.sort((a, b) => a.level - b.level); // Sort back to 50->90

        const isHybridValid = filteredHybridPackages.length > 0;

        // --- Check if any system is valid ---
        if (!isOngridValid && !isHybridValid) {
            ui.errorMessage.textContent = currentTranslations['error_no_valid_system']; // Cập nhật
            ui.resultsSection.classList.add('hidden');
            return;
        }

        // --- Update UI ---
        document.getElementById('day-kwh').textContent = dayKwh.toFixed(2);
        document.getElementById('night-kwh').textContent = nightKwh.toFixed(2);

        // Update Ongrid UI & Data Attributes
        const ongridCard = ui.results.ongrid.querySelector('.result-card');
        if (ongridCard) {
            ongridCard.dataset.resultDetails = JSON.stringify({
                type: 'ongrid',
                capacity: calculationState.ongrid.capacity.toFixed(2),
                saving: calculationState.ongrid.saving,
                roofArea: calculationState.ongrid.roofArea.toFixed(2)
            });
            ui.ongridResultImage.src = getImage('ongrid', null, timeOfDay);
        }
        ui.results.ongridRoofAreaWrapper.classList.toggle('hidden', knowsRoof);
        document.getElementById('ongrid-capacity').textContent = calculationState.ongrid.capacity.toFixed(2);
        document.getElementById('ongrid-saving').textContent = formatter.format(calculationState.ongrid.saving);
        document.getElementById('ongrid-roof-area').textContent = calculationState.ongrid.roofArea.toFixed(2);

        // Update Hybrid UI & Data Attributes
        const hybridCards = [document.getElementById('hybrid-card-50'), document.getElementById('hybrid-card-70'), document.getElementById('hybrid-card-90')];
        hybridCards.forEach(card => {
            if (card) delete card.dataset.resultDetails;
        });

        [ui.results.hybridSingle, ui.results.hybridGrid, ...hybridCards]
            .forEach(el => { if (el) el.classList.add('hidden'); });

        if (filteredHybridPackages.length === 1) {
            const pkg = filteredHybridPackages[0];
            const singleCard = ui.results.hybridSingle;
            const optionNumber = mapLevelToOptionNumber(pkg.level, filteredHybridPackages);

            singleCard.dataset.resultDetails = JSON.stringify({
                type: 'hybrid',
                option: optionNumber,
                capacity: pkg.capacity.toFixed(2),
                saving: pkg.saving,
                packs: pkg.packs,
                roofArea: pkg.roofArea.toFixed(2)
            });
            singleCard.dataset.resultType = `hybrid-option-${optionNumber}`;

            document.getElementById('hybrid-single-title').textContent = `${currentTranslations['hybrid_title_short']} - ${currentTranslations[`hybrid_option_${optionNumber}`] || `Phương án ${optionNumber}`}`; // Cập nhật

            document.getElementById('hybrid-single-capacity').textContent = pkg.capacity.toFixed(2);
            document.getElementById('hybrid-single-saving').textContent = formatter.format(pkg.saving);
            document.getElementById('hybrid-single-packs').textContent = formatPackCount(pkg.packs);
            document.getElementById('hybrid-single-roof-area').textContent = pkg.roofArea.toFixed(2);
            ui.results.hybridSingleRoofAreaWrapper.classList.toggle('hidden', knowsRoof); // Toggle based on choice

            if (ui.hybridSingleImage) {
                ui.hybridSingleImage.src = getImage('hybrid', pkg.level, timeOfDay);
            }
            singleCard.classList.remove('hidden');

            // HIDE multi-header if only 1 result
            if (ui.results.hybridMultiHeader) ui.results.hybridMultiHeader.classList.add('hidden');

        } else if (filteredHybridPackages.length > 1) {

            // SHOW multi-header if multiple results
            if (ui.results.hybridMultiHeader) ui.results.hybridMultiHeader.classList.remove('hidden');

            ui.results.hybridGrid.classList.remove('hidden');
            if (filteredHybridPackages.length === 2) {
                ui.results.hybridGrid.classList.remove('md:grid-cols-3');
                ui.results.hybridGrid.classList.add('md:grid-cols-2', 'max-w-3xl', 'mx-auto');
            } else {
                ui.results.hybridGrid.classList.remove('md:grid-cols-2', 'max-w-3xl', 'mx-auto');
                ui.results.hybridGrid.classList.add('md:grid-cols-3');
            }
            filteredHybridPackages.forEach((pkg, index) => {
                const card = document.getElementById(`hybrid-card-${pkg.level}`);
                const optionNumber = mapLevelToOptionNumber(pkg.level, filteredHybridPackages);

                // Reset Animation Classes
                card.classList.remove('stagger-1', 'stagger-2', 'stagger-3', 'animate-fade-in-up');
                void card.offsetWidth; // Trigger reflow
                card.classList.add('animate-fade-in-up', `stagger-${index + 1}`);

                card.dataset.resultDetails = JSON.stringify({
                    type: 'hybrid',
                    option: optionNumber,
                    capacity: pkg.capacity.toFixed(2),
                    saving: pkg.saving,
                    packs: pkg.packs,
                    roofArea: pkg.roofArea.toFixed(2)
                });

                const titleElement = card.querySelector('h3');
                if (titleElement) {
                    titleElement.textContent = currentTranslations[`hybrid_option_${optionNumber}`] || `Phương án ${optionNumber}`; // Cập nhật
                    titleElement.dataset.translate = `hybrid_option_${optionNumber}`;
                }

                document.getElementById(`hybrid-capacity-${pkg.level}`).textContent = pkg.capacity.toFixed(2);
                document.getElementById(`hybrid-saving-${pkg.level}`).textContent = formatter.format(pkg.saving);
                document.getElementById(`bess-packs-${pkg.level}`).textContent = formatPackCount(pkg.packs);
                document.getElementById(`hybrid-roof-area-${pkg.level}`).textContent = pkg.roofArea.toFixed(2);
                ui.results.hybridRoofAreaWrappers[pkg.level].classList.toggle('hidden', knowsRoof); // Toggle based on choice

                const imgEl = document.getElementById(`hybrid-image-${pkg.level}`);
                if (imgEl) {
                    imgEl.src = getImage('hybrid', pkg.level, timeOfDay);
                }
                card.classList.remove('hidden');
            });
        }

        // Handle Toggle Switch state
        ui.resultToggle.optionOngrid.classList.toggle('disabled', !isOngridValid);
        ui.resultToggle.optionHybrid.classList.toggle('disabled', !isHybridValid);

        // Show results and switch to a valid view
        if (isOngridValid) {
            switchResultView('ongrid');
        } else {
            switchResultView('hybrid');
        }

        ui.resultsSection.classList.remove('hidden');
        ui.panelPackInfo.classList.remove('hidden');
    };


    // --- EVENT LISTENERS ---

    // (MỚI) Tải ngôn ngữ mặc định (vi)
    switchLanguage('vi');

    // Form submission
    ui.form.addEventListener('submit', (e) => {
        e.preventDefault();
        calculateAndDisplayResults();
        if (!ui.resultsSection.classList.contains('hidden')) {
            ui.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });

    // Bill input formatting with cursor preservation
    ui.billInput.addEventListener('input', (e) => {
        const input = e.target;
        const originalValue = input.value;

        // 1. Get current cursor position and count digits before it
        const selectionStart = input.selectionStart;
        let digitsBeforeCursor = 0;
        for (let i = 0; i < selectionStart; i++) {
            if (/[0-9]/.test(originalValue[i])) {
                digitsBeforeCursor++;
            }
        }

        // 2. Format the number
        let numValue = originalValue.replace(/[^0-9]/g, '');
        const formattedValue = numValue ? formatter.format(numValue) : '';
        input.value = formattedValue;

        // 3. Restore cursor position
        if (formattedValue) {
            let newCursorPos = 0;
            let digitsSeen = 0;
            for (let i = 0; i < formattedValue.length; i++) {
                if (/[0-9]/.test(formattedValue[i])) {
                    digitsSeen++;
                }
                newCursorPos++;
                if (digitsSeen === digitsBeforeCursor) {
                    break;
                }
            }
            // Handle edge case where we deleted the last digit
            if (digitsBeforeCursor > digitsSeen) newCursorPos = formattedValue.length;

            input.setSelectionRange(newCursorPos, newCursorPos);
        }
    });

    // Price type selection
    const optionBoxes = ui.priceTypeOptions.querySelectorAll('.option-box');
    optionBoxes.forEach(box => {
        box.addEventListener('click', () => {
            optionBoxes.forEach(b => b.classList.remove('selected'));
            box.classList.add('selected');
            ui.hiddenPriceType.value = box.dataset.value;
        });
    });

    // Set initial selection state for price type
    const initialSelected = ui.priceTypeOptions.querySelector('.option-box[data-value="3500"]');
    if (initialSelected) initialSelected.classList.add('selected');

    // Day Usage Slider update
    ui.dayUsageSlider.addEventListener('input', (e) => {
        ui.dayUsageValue.textContent = `${e.target.value}%`;
        if (!ui.resultsSection.classList.contains('hidden')) {
            calculateAndDisplayResults();
        }
    });

    // Panel Power Change
    if (ui.panelPowerInput) {
        ui.panelPowerInput.addEventListener('change', () => {
            if (!ui.resultsSection.classList.contains('hidden')) {
                calculateAndDisplayResults();
            }
        });
    }

    // Roof Area Choice
    ui.roofChoiceOptions.addEventListener('click', (e) => {
        const clickedBox = e.target.closest('.option-box');
        if (!clickedBox) return;

        ui.roofChoiceOptions.querySelectorAll('.option-box').forEach(box => box.classList.remove('selected'));
        clickedBox.classList.add('selected');

        const choice = clickedBox.dataset.roofChoice;
        if (choice === 'yes') {
            ui.roofAreaInputWrapper.classList.remove('hidden');
        } else {
            ui.roofAreaInputWrapper.classList.add('hidden');
            ui.roofAreaInput.value = ''; // Clear input if user selects "No"
        }

        // Re-calculate results if already visible
        if (!ui.resultsSection.classList.contains('hidden')) {
            calculateAndDisplayResults();
        }
    });


    // Language switcher logic
    ui.langSwitcher.button.addEventListener('click', () => {
        ui.langSwitcher.menu.classList.toggle('hidden');
    });
    ui.langSwitcher.menu.addEventListener('click', (e) => {
        e.preventDefault();
        const link = e.target.closest('[data-lang]');
        if (link) switchLanguage(link.dataset.lang);
    });

    document.addEventListener('click', (e) => {
        if (ui.langSwitcher.container && !ui.langSwitcher.container.contains(e.target)) {
            if (ui.langSwitcher.menu && !ui.langSwitcher.menu.classList.contains('hidden')) {
                ui.langSwitcher.menu.classList.add('hidden');
            }
        }
    });

    // Result Toggle Switch Logic
    ui.resultToggle.toggle.addEventListener('click', (e) => {
        const option = e.target.closest('.toggle-switch-option');
        if (!option || option.classList.contains('disabled')) {
            return;
        }
        switchResultView(option.dataset.type);
    });

    // Result Card Selection
    document.querySelectorAll('.result-card').forEach(card => {
        card.addEventListener('click', handleResultSelection);
    });

    // Confirmation Button Click
    ui.confirmButton.addEventListener('click', openPopup);


    // Panel Power Input Change
    ui.panelPowerInput.addEventListener('input', () => {
        if (!ui.resultsSection.classList.contains('hidden')) {
            calculateAndDisplayResults();
        }
    });

    // --- Popup Logic ---
    ui.popup.closeButton.addEventListener('click', closePopup);
    ui.popup.overlay.addEventListener('click', (e) => {
        if (e.target === ui.popup.overlay) {
            closePopup();
        }
    });

    // --- Image Popup Logic ---
    ui.popup.closeImageButton.addEventListener('click', closeImagePopup);
    ui.popup.imageOverlay.addEventListener('click', (e) => {
        if (e.target === ui.popup.imageOverlay) {
            closeImagePopup();
        }
    });

    // Event delegation for all 'view-image-button' clicks
    ui.resultsSection.addEventListener('click', (e) => {
        const button = e.target.closest('.view-image-button');
        if (!button) return;

        e.preventDefault();
        e.stopPropagation();
        const image = button.closest('.relative').querySelector('img');
        if (image && image.src) {
            openImagePopup(image.src);
        }
    });


    // Phone input validation (only numbers on keypress)
    ui.popup.phoneInput.addEventListener('input', (e) => {
        const value = e.target.value;
        const numericValue = value.replace(/[^0-9]/g, '');
        if (value !== numericValue) {
            e.target.value = numericValue;
        }
        // Hide format error message while typing
        ui.popup.phoneError.classList.add('hidden');
    });

    // (Đã cập nhật) Popup form submission
    ui.popup.form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Reset error message
        ui.popup.popupErrorMessage.textContent = '';

        // Basic validation check
        if (!ui.popup.phoneInput.value.match(/^0\d{9}$/)) { // Updated regex
            ui.popup.phoneError.textContent = currentTranslations['popup_phone_error_format'] || 'Vui lòng nhập SĐT 10 số, bắt đầu bằng 0.'; // Set specific error text
            ui.popup.phoneError.classList.remove('hidden');
            return;
        }

        // Show loading state
        const originalButtonText = ui.popup.submitButton.textContent;
        ui.popup.submitButton.textContent = currentTranslations['popup_submitting_button'] || 'Đang gửi...';
        ui.popup.submitButton.disabled = true;

        // 1. Gather all data
        const formData = {
            _subject: "Đăng ký tư vấn lắp đặt - Từ Web Calculator",
            // Form data
            "Họ và Tên": ui.popup.nameInput.value,
            "Số điện thoại": ui.popup.phoneInput.value,
            "Khu vực": ui.regionSelect.value,
            "Hóa đơn hàng tháng": ui.billInput.value,
            "Loại giá điện": ui.hiddenPriceType.value === '3500' ? 'Sinh hoạt' : 'Kinh doanh',
            "Tỷ lệ sử dụng ban ngày": `${ui.dayUsageSlider.value}%`,
            "Biết diện tích mái": ui.roofChoiceOptions.querySelector('.selected').dataset.roofChoice === 'yes' ? 'Có' : 'Không',
            "Diện tích mái (đã nhập)": ui.roofAreaInput.value || 'N/A',

            // Selected system
            "Hệ thống đã chọn": ui.popup.selectedSystemInput.value
        };

        try {
            // 2. Send data to Formspree
            const response = await fetch(`https://formspree.io/f/${AppConfig.FORMSPREE_ENDPOINT}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json"
                },
                body: JSON.stringify(formData)
            });


            if (response.ok) {
                // 3. Handle Success
                console.log('Form Submitted Successfully!');
                closePopup();

                // Show toast notification
                ui.toast.textContent = currentTranslations['toast_message']; // Set correct message
                ui.toast.classList.remove('opacity-0');
                setTimeout(() => {
                    ui.toast.classList.add('opacity-0');
                }, 3000); // Hide after 3 seconds

            } else {
                // 4. Handle Formspree Error
                const result = await response.json();
                console.error("Form submission error:", result);
                ui.popup.popupErrorMessage.textContent = currentTranslations['popup_error_message'];
            }

        } catch (error) {
            // 5. Handle Network Error
            console.error("Network error:", error);
            ui.popup.popupErrorMessage.textContent = currentTranslations['popup_error_message'];
        } finally {
            // 6. Reset button state
            ui.popup.submitButton.textContent = originalButtonText;
            ui.popup.submitButton.disabled = false;
        }
    });

    // Setup Scroll Animations
    const setupAnimations = () => {
        const observerOptions = {
            root: null,
            rootMargin: '0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('active');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        document.querySelectorAll('.reveal, .reveal-fade').forEach(el => {
            observer.observe(el);
        });
    };

    // --- EVN TIERED PRICING LOGIC ---
    // Moved to solar-calculations.js

    // EVN Tool UI Handlers
    const evnTool = {
        trigger: document.getElementById('open-evn-tool'),
        popup: document.getElementById('evn-popup'),
        closeBtn: document.getElementById('close-evn-popup'),
        input: document.getElementById('evn-kwh-input'),
        calculateBtn: document.getElementById('evn-calculate-btn'),
        resultContainer: document.getElementById('evn-result-container'),
        tableBody: document.getElementById('evn-result-table-body'),
        totalPreTaxDisplay: document.getElementById('evn-total-pre-tax'),
        taxDisplay: document.getElementById('evn-tax-amt'),
        finalTotalDisplay: document.getElementById('evn-final-total'),
        toggleInputs: document.querySelectorAll('input[name="evn-calc-mode"]'), // New radio buttons
        inputLabel: document.getElementById('evn-input-label'),
        inputUnit: document.getElementById('evn-input-unit'),
        // Summary Rows
        rowPreTax: document.getElementById('evn-row-pre-tax'),
        rowTax: document.getElementById('evn-row-tax'),
        labelFinal: document.getElementById('evn-label-final')
    };

    if (evnTool.trigger) {
        // Open Popup
        evnTool.trigger.addEventListener('click', () => {
            evnTool.popup.classList.add('active');
            setTimeout(() => evnTool.input.focus(), 100);
        });

        // Close Popup
        const closeEvnPopup = () => {
            evnTool.popup.classList.remove('active');
        };
        evnTool.closeBtn.addEventListener('click', closeEvnPopup);
        evnTool.popup.addEventListener('click', (e) => {
            if (e.target === evnTool.popup) closeEvnPopup();
        });

        // Toggle Calculation Mode
        let currentMode = 'kwh'; // 'kwh' or 'money'

        // Real-time Number Formatting
        evnTool.input.addEventListener('input', function (e) {
            let rawValue = this.value.replace(/\./g, '').replace(/,/g, ''); // Remove existing separators
            if (!rawValue) {
                this.value = '';
                return;
            }

            if (currentMode === 'money') {
                if (!isNaN(rawValue)) {
                    this.value = parseInt(rawValue).toLocaleString('vi-VN');
                }
            } else {
                if (!isNaN(rawValue)) {
                    this.value = parseInt(rawValue).toLocaleString('vi-VN');
                }
            }
        });

        if (evnTool.toggleInputs) {
            evnTool.toggleInputs.forEach(radio => {
                radio.addEventListener('change', (e) => {
                    currentMode = e.target.value;
                    evnTool.input.value = ''; // Clear input
                    evnTool.resultContainer.classList.add('hidden'); // Hide results

                    if (currentMode === 'money') {
                        evnTool.inputLabel.textContent = 'Tổng số tiền điện (VNĐ):';
                        evnTool.input.placeholder = 'Ví dụ: 1.000.000';
                        evnTool.inputUnit.textContent = 'đ';
                    } else {
                        evnTool.inputLabel.textContent = 'Tổng điện năng tiêu thụ (kWh):';
                        evnTool.input.placeholder = 'Ví dụ: 550';
                        evnTool.inputUnit.textContent = 'kWh';
                    }
                    evnTool.input.focus();
                });
            });
        }

        // Calculate Action
        evnTool.calculateBtn.addEventListener('click', () => {
            // Clean formatted string (remove dots) before parsing
            let cleanValue = evnTool.input.value.replace(/\./g, '').replace(/,/g, '');
            let value = parseFloat(cleanValue);

            if (!value || value < 0) {
                alert('Vui lòng nhập giá trị hợp lệ!');
                return;
            }

            let kwh = value;
            // Depending on mode, calculate kWh first
            if (currentMode === 'money') {
                kwh = SolarCalculations.convertMoneyToKWh(value);
            }

            // Always calculate detailed breakdown based on kWh
            const result = SolarCalculations.calculateTieredPrice(kwh);

            // Render Table (Standard breakdown)
            evnTool.tableBody.innerHTML = result.details.map(d => `
                <tr class="hover:bg-gray-50 transition">
                    <td class="px-4 py-3 font-medium text-gray-800">Bậc ${d.tier}</td>
                    <td class="px-4 py-3 text-right text-gray-600">${formatter.format(d.price)}</td>
                    <td class="px-4 py-3 text-right font-bold text-gray-800">${d.amount.toFixed(2)}</td>
                    <td class="px-4 py-3 text-right font-bold text-[var(--brand-dark-blue)]">${formatter.format(d.cost)}</td>
                </tr>
            `).join('');

            // Render Totals
            if (currentMode === 'money') {
                // If input was Money, show the resulting kWh prominently
                // Hide Money details (as user requested "result must be kWh, not money")
                if (evnTool.rowPreTax) evnTool.rowPreTax.classList.add('hidden');
                if (evnTool.rowTax) evnTool.rowTax.classList.add('hidden');

                evnTool.labelFinal.textContent = "TỔNG SẢN LƯỢNG ĐIỆN:";
                evnTool.finalTotalDisplay.textContent = kwh.toLocaleString('vi-VN', { maximumFractionDigits: 1 }) + ' kWh';
                evnTool.finalTotalDisplay.style.color = 'yellow'; // ensure highlighting
            } else {
                // If input was kWh, show the Money result (Normal behavior)
                if (evnTool.rowPreTax) evnTool.rowPreTax.classList.remove('hidden');
                if (evnTool.rowTax) evnTool.rowTax.classList.remove('hidden');

                evnTool.labelFinal.textContent = "TỔNG THANH TOÁN:";
                evnTool.totalPreTaxDisplay.textContent = formatter.format(result.totalPreTax) + ' đ';
                evnTool.taxDisplay.textContent = formatter.format(result.tax) + ' đ';
                evnTool.finalTotalDisplay.textContent = formatter.format(result.total) + ' đ';
            }

            // Show Results
            evnTool.resultContainer.classList.remove('hidden');

            // Scroll to results
            setTimeout(() => {
                evnTool.resultContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        });
    }

    // Initialize
    const init = () => {
        switchLanguage('vi');
        setupAnimations();
    };

    init();

});

// Register Service Worker for PWA Offline support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    });
}