document.addEventListener("DOMContentLoaded", () => {
    const balanceEl = document.getElementById("balance");
    const incomeEl = document.getElementById("income");
    const expensesEl = document.getElementById("expenses");
    const transactionForm = document.getElementById("transaction-form");
    const monthlyIncomeForm = document.getElementById("monthly-income-form");
    const monthlyIncomeInput = document.getElementById("monthly-income");
    const transactionList = document.getElementById("transaction-list");
    const descInput = document.getElementById("desc");
    const amountInput = document.getElementById("amount");
    const categoryInput = document.getElementById("category");
    const dateInput = document.getElementById("date");
    const monthSelect = document.getElementById("month-select");

    // Chart instances
    let expensePieChart = null;
    let monthlyExpensesChart = null;

    // Set default date to today
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;

    // Format currency as Swiss Francs
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF'
        }).format(amount);
    };

    // Format date to DD/MM/YYYY
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    // Initialize month selector
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((month, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.textContent = month;
        if (index === today.getMonth()) {
            option.selected = true;
        }
        monthSelect.appendChild(option);
    });

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let monthlyIncome = JSON.parse(localStorage.getItem("monthlyIncome")) || 0;
    monthlyIncomeInput.value = monthlyIncome;

    function createExpensePieChart(expensesByCategory) {
        const ctx = document.getElementById('expensePieChart').getContext('2d');

        if (expensePieChart) {
            expensePieChart.destroy();
        }

        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
        ];

        expensePieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(expensesByCategory),
                datasets: [{
                    data: Object.values(expensesByCategory),
                    backgroundColor: colors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }

    function createMonthlyExpensesChart(monthlyExpenses) {
        const ctx = document.getElementById('monthlyExpensesChart').getContext('2d');

        if (monthlyExpensesChart) {
            monthlyExpensesChart.destroy();
        }

        const average = monthlyExpenses.reduce((a, b) => a + b, 0) / monthlyExpenses.length;

        monthlyExpensesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Monthly Expenses',
                        data: monthlyExpenses,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Average',
                        data: monthlyExpenses.map(() => average),
                        type: 'line',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${formatCurrency(context.raw)}`;
                            }
                        }
                    }
                }
            }
        });
    }

    function updateCharts() {
        // Calculate expenses by category for the current month
        const expensesByCategory = {};
        const monthlyExpenses = new Array(12).fill(0);

        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            const transactionMonth = new Date(transaction.date).getMonth();

            if (amount < 0) {
                const category = transaction.category;
                expensesByCategory[category] = (expensesByCategory[category] || 0) + Math.abs(amount);
                monthlyExpenses[transactionMonth] += Math.abs(amount);
            }
        });

        createExpensePieChart(expensesByCategory);
        createMonthlyExpensesChart(monthlyExpenses);
    }

    function addMonthlyIncomeTransaction(month) {
        const year = new Date().getFullYear();
        // Calculate the payment date (25th or previous Friday if 25th is weekend)
        let paymentDate = new Date(year, month, 25);
        const dayOfWeek = paymentDate.getDay();

        // If 25th is Saturday (6) or Sunday (0), move to previous Friday
        if (dayOfWeek === 0) { // Sunday
            paymentDate.setDate(24); // Move to Friday
        } else if (dayOfWeek === 6) { // Saturday
            paymentDate.setDate(24); // Move to Friday
        }

        const paymentDateString = paymentDate.toISOString();

        const existingIncome = transactions.find(t =>
            t.desc === "Monthly Income" &&
            new Date(t.date).getMonth() === month &&
            new Date(t.date).getFullYear() === year
        );

        if (!existingIncome && monthlyIncome > 0) {
            const incomeTransaction = {
                id: `monthly-income-${month}-${year}`,
                desc: "Monthly Income",
                amount: monthlyIncome,
                category: "income",
                date: paymentDateString
            };
            transactions.push(incomeTransaction);
            localStorage.setItem("transactions", JSON.stringify(transactions));
        }
    }

    function updateUI() {
        let income = 0, expenses = 0;
        transactionList.innerHTML = "";

        const selectedMonth = parseInt(monthSelect.value);
        addMonthlyIncomeTransaction(selectedMonth);

        const filteredTransactions = transactions.filter(transaction => new Date(transaction.date).getMonth() === selectedMonth);

        filteredTransactions.forEach(transaction => {
            const li = document.createElement("li");
            const formattedDate = formatDate(transaction.date);
            const amount = parseFloat(transaction.amount);
            const formattedAmount = formatCurrency(Math.abs(amount));
            const isIncome = amount > 0;
            const isMonthlyIncome = transaction.id.toString().startsWith('monthly-income-');

            li.innerHTML = `
                <div class="transaction-info">
                    <span class="transaction-desc">${transaction.desc}</span>
                    <span class="transaction-date">${formattedDate}</span>
                </div>
                <div class="transaction-amount ${isIncome ? 'income' : 'expense'}">
                    ${isIncome ? '+' : '-'}${formattedAmount}
                    ${!isMonthlyIncome ? `<button onclick="removeTransaction('${transaction.id}')">X</button>` : ''}
                </div>
            `;
            transactionList.appendChild(li);

            if (isIncome) {
                income += amount;
            } else {
                expenses += Math.abs(amount);
            }
        });

        const balance = income - expenses;

        balanceEl.textContent = formatCurrency(balance);
        incomeEl.textContent = formatCurrency(income);
        expensesEl.textContent = formatCurrency(expenses);
        localStorage.setItem("transactions", JSON.stringify(transactions));

        // Update charts
        updateCharts();
    }

    monthlyIncomeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newMonthlyIncome = parseFloat(monthlyIncomeInput.value);

        // Remove all existing monthly income transactions
        transactions = transactions.filter(transaction => !transaction.id.toString().startsWith('monthly-income-'));

        // Update the monthly income value
        monthlyIncome = newMonthlyIncome;
        localStorage.setItem("monthlyIncome", JSON.stringify(monthlyIncome));

        // Add new monthly income transactions for all months
        for (let month = 0; month < 12; month++) {
            addMonthlyIncomeTransaction(month);
        }

        updateUI();
    });

    transactionForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const desc = descInput.value.trim();
        let amount = parseFloat(amountInput.value.trim());
        const category = categoryInput.value.toLowerCase();
        const date = dateInput.value;

        if (!desc || isNaN(amount)) return;

        // Always use positive numbers in the input
        // Convert to negative for non-income categories
        if (category !== "income") {
            amount = -Math.abs(amount);
        }

        const transaction = {
            id: Date.now(),
            desc,
            amount,
            category,
            date
        };

        transactions.push(transaction);
        updateUI();
        transactionForm.reset();
        // Reset date to today
        dateInput.value = `${year}-${month}-${day}`;
    });

    window.removeTransaction = (id) => {
        if (!id.toString().startsWith('monthly-income-')) {
            // Convert numeric IDs to strings for comparison since Date.now() creates numbers
            transactions = transactions.filter(transaction => transaction.id.toString() !== id.toString());
            localStorage.setItem("transactions", JSON.stringify(transactions));
            updateUI();
        }
    };

    monthSelect.addEventListener("change", updateUI);

    updateUI();
});
