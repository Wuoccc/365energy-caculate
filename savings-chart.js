/**
 * SAVINGS CHART CALCULATIONS & CONFIGURATION
 * 
 * This file handles:
 * 1. The specific "Back-calculation" logic for the 12-month savings pattern.
 * 2. Chart.js configuration, styling, and animation settings.
 */

// Ensure SolarCalculations (solar-calculations.js) is loaded first
if (typeof SolarCalculations === 'undefined') {
    console.warn("SolarCalculations is not defined. Make sure solar-calculations.js is loaded first.");
}

const SavingsChartManager = {
    chartInstance: null,
    formatter: new Intl.NumberFormat('vi-VN'),

    /**
     * Initializes or Updates the Savings Chart
     * @param {HTMLCanvasElement} canvasElement - The canvas DOM element
     * @param {number} billAmount - User's monthly bill (VNĐ)
     * @param {number} systemCapacity - System capacity (kWp)
     */
    updateChart: function (canvasElement, billAmount, systemCapacity) {
        if (!canvasElement) return;

        // 1. Calculate Data using the logic moved here or reference SolarCalculations
        // User requested: "tách cái công thức tính biểu đồ dòng tiền tiết kiệm dự kiến ra một file riêng"
        // The core math is in SolarCalculations.calculateMonthlySavingsPattern (solar-calculations.js),
        // which is good reuse. We will call it here.
        const calculationResult = SolarCalculations.calculateMonthlySavingsPattern(billAmount, systemCapacity);

        // Extract Data
        const dataValues = calculationResult.chartData;

        // 2. Generate Labels (Current Year)
        const currentYear = new Date().getFullYear();
        const labels = Array.from({ length: 12 }, (_, i) => `Tháng ${i + 1}/${currentYear}`);

        // 3. Destroy old chart if exists
        if (this.chartInstance) {
            this.chartInstance.destroy();
        }

        // 4. Configure & Render Chart
        const ctx = canvasElement.getContext('2d');

        // Brand Colors
        // --brand-green: #6ca302 (from style.css / perceived) -> Using a vibrant green for chart
        // --brand-dark-blue: #0c2d5c
        // User asked for "Màu sắc đồng bộ với trang web".

        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
        gradient.addColorStop(0, '#6ca302');   // Brand Green
        gradient.addColorStop(1, 'rgba(108, 163, 2, 0.6)'); // Fade out

        this.chartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Tiền điện tiết kiệm',
                    data: dataValues,
                    backgroundColor: gradient,
                    borderColor: '#6ca302',
                    borderWidth: 1,
                    borderRadius: 6, // Softer corners
                    hoverBackgroundColor: '#8bc34a', // Lighter green on hover
                    barPercentage: 0.6, // Slimmer bars for elegance
                    categoryPercentage: 0.8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 1500, // Smooth 1.5s animation
                    easing: 'easeOutQuart', // Mượt mà
                    delay: (context) => {
                        let delay = 0;
                        if (context.type === 'data' && context.mode === 'default') {
                            delay = context.dataIndex * 100; // Stagger effect
                        }
                        return delay;
                    }
                },
                plugins: {
                    legend: {
                        display: false // Hide legend for cleaner look, title is enough
                    },
                    tooltip: {
                        backgroundColor: 'rgba(12, 45, 92, 0.9)', // Dark blue background
                        titleColor: '#fff',
                        titleFont: { family: 'Montserrat', size: 13, weight: 'bold' },
                        bodyColor: '#fff',
                        bodyFont: { family: 'Montserrat', size: 13 },
                        padding: 12,
                        cornerRadius: 8,
                        displayColors: false,
                        callbacks: {
                            label: (context) => {
                                return `Tiết kiệm: ${this.formatter.format(context.raw)} đ`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.03)', // Very subtle
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280', // Gray-500
                            font: { family: 'Montserrat', size: 11, weight: '500' },
                            stepSize: 500000, // "cách nhau 500.000 đơn vị"
                            callback: (value) => {
                                // "1tr viết ra là 1.000.000đ" -> Use standard formatter
                                return this.formatter.format(value) + 'đ';
                            }
                        },
                        border: { display: false }
                    },
                    x: {
                        grid: {
                            display: false,
                            drawBorder: false
                        },
                        ticks: {
                            color: '#6b7280',
                            font: { family: 'Montserrat', size: 11 },
                            maxRotation: 0 // Keep straight if possible
                        }
                    }
                }
            }
        });
    }
};

window.SavingsChartManager = SavingsChartManager;
