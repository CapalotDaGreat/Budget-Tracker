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
    const startDateInput = document.getElementById("start-date");
    const endDateInput = document.getElementById("end-date");
    const applyFilterBtn = document.getElementById("apply-filter");
    const resetFilterBtn = document.getElementById("reset-filter");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");
    const newCategoryInput = document.getElementById("new-category");
    const addCategoryBtn = document.getElementById("add-category-btn");
    const categoriesList = document.getElementById("categories-list");
    const limitCategorySelect = document.getElementById("limit-category");
    const limitAmountInput = document.getElementById("limit-amount");
    const setLimitBtn = document.getElementById("set-limit-btn");
    const budgetLimitsList = document.getElementById("budget-limits-list");
    const isRecurringCheckbox = document.getElementById("is-recurring");
    const recurringFrequencySelect = document.getElementById("recurring-frequency");

    let expensePieChart = null;
    let monthlyExpensesChart = null;
    let trendChart = null;
    let budgetComparisonChart = null;

    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    dateInput.value = `${year}-${month}-${day}`;

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let monthlyIncome = JSON.parse(localStorage.getItem("monthlyIncome")) || 0;
    let categories = JSON.parse(localStorage.getItem("categories")) || ["income", "food", "rent", "entertainment", "tax"];
    let budgetLimits = JSON.parse(localStorage.getItem("budgetLimits")) || {};
    let isFilterActive = false;
    let searchTerm = "";
    let recurringTransactions = JSON.parse(localStorage.getItem("recurringTransactions")) || [];
    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

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

    monthlyIncomeInput.value = monthlyIncome;

    function updateCategorySelects() {
        categoryInput.innerHTML = "";
        limitCategorySelect.innerHTML = "";
        
        categories.forEach(category => {
            let option = document.createElement("option");
            option.value = category.toLowerCase();
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            categoryInput.appendChild(option);
        });
        
        categories.filter(category => category.toLowerCase() !== "income").forEach(category => {
            let option = document.createElement("option");
            option.value = category.toLowerCase();
            option.textContent = category.charAt(0).toUpperCase() + category.slice(1);
            limitCategorySelect.appendChild(option);
        });
    }

    function updateCategoriesList() {
        categoriesList.innerHTML = "";
        
        categories.forEach(category => {
            if (category.toLowerCase() === "income") return;
            
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${category.charAt(0).toUpperCase() + category.slice(1)}</span>
                <div class="category-item-controls">
                    <button class="delete-category" data-category="${category}">Delete</button>
                </div>
            `;
            categoriesList.appendChild(li);
        });
        
        document.querySelectorAll(".delete-category").forEach(button => {
            button.addEventListener("click", (e) => {
                const categoryToDelete = e.target.getAttribute("data-category");
                deleteCategory(categoryToDelete);
            });
        });
    }

    function updateBudgetLimitsList() {
        budgetLimitsList.innerHTML = "";
        
        Object.keys(budgetLimits).forEach(category => {
            const limit = budgetLimits[category];
            const li = document.createElement("li");
            li.innerHTML = `
                <span>${category.charAt(0).toUpperCase() + category.slice(1)}: ${formatCurrency(limit)}</span>
                <div class="budget-item-controls">
                    <button class="delete-limit" data-category="${category}">Delete</button>
                </div>
            `;
            budgetLimitsList.appendChild(li);
        });
        
        document.querySelectorAll(".delete-limit").forEach(button => {
            button.addEventListener("click", (e) => {
                const categoryToDelete = e.target.getAttribute("data-category");
                deleteBudgetLimit(categoryToDelete);
            });
        });
    }

    function addCategory(categoryName) {
        categoryName = categoryName.trim().toLowerCase();
        
        if (categoryName === "") return;
        if (categories.includes(categoryName)) return;
        
        categories.push(categoryName);
        localStorage.setItem("categories", JSON.stringify(categories));
        
        updateCategorySelects();
        updateCategoriesList();
    }

    function deleteCategory(categoryName) {
        if (categoryName.toLowerCase() === "income") return;
        
        categories = categories.filter(cat => cat !== categoryName);
        localStorage.setItem("categories", JSON.stringify(categories));
        
        if (budgetLimits[categoryName]) {
            delete budgetLimits[categoryName];
            localStorage.setItem("budgetLimits", JSON.stringify(budgetLimits));
        }
        
        updateCategorySelects();
        updateCategoriesList();
        updateBudgetLimitsList();
    }

    function setBudgetLimit(category, amount) {
        if (category === "income" || amount <= 0) return;
        
        budgetLimits[category] = amount;
        localStorage.setItem("budgetLimits", JSON.stringify(budgetLimits));
        
        updateBudgetLimitsList();
        updateUI();
    }

    function deleteBudgetLimit(category) {
        if (budgetLimits[category]) {
            delete budgetLimits[category];
            localStorage.setItem("budgetLimits", JSON.stringify(budgetLimits));
            
            updateBudgetLimitsList();
            updateUI();
        }
    }

    function matchesFilter(transaction) {
        const transactionDate = new Date(transaction.date);
        const selectedMonth = parseInt(monthSelect.value);
        
        if (!isFilterActive) {
            return transactionDate.getMonth() === selectedMonth;
        }
        
        const startDate = startDateInput.value ? new Date(startDateInput.value) : null;
        const endDate = endDateInput.value ? new Date(endDateInput.value) : null;
        
        if (startDate && endDate) {
            return transactionDate >= startDate && transactionDate <= endDate;
        } else if (startDate) {
            return transactionDate >= startDate;
        } else if (endDate) {
            return transactionDate <= endDate;
        }
        
        return true;
    }

    function matchesSearch(transaction) {
        if (!searchTerm) return true;
        
        const termLower = searchTerm.toLowerCase();
        return transaction.desc.toLowerCase().includes(termLower) || 
               transaction.category.toLowerCase().includes(termLower);
    }

    function createExpensePieChart(expensesByCategory) {
        const ctx = document.getElementById('expensePieChart').getContext('2d');
        
        if (expensePieChart) {
            expensePieChart.destroy();
        }

        const colors = [
            '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
            '#FF9F40', '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'
        ];

        const sortedCategories = Object.keys(expensesByCategory).sort((a, b) => 
            expensesByCategory[b] - expensesByCategory[a]
        );
        
        const chartData = sortedCategories.map(category => expensesByCategory[category]);
        const chartColors = sortedCategories.map((_, i) => colors[i % colors.length]);

        expensePieChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: sortedCategories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
                datasets: [{
                    data: chartData,
                    backgroundColor: chartColors,
                    borderColor: '#fff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            color: '#f7fafc'
                        }
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

        const nonZeroMonths = monthlyExpenses.filter(amount => amount > 0);
        const average = nonZeroMonths.length > 0 
            ? nonZeroMonths.reduce((a, b) => a + b, 0) / nonZeroMonths.length 
            : 0;

        const textColor = '#f7fafc';

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
                            color: textColor,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            color: 'rgba(160, 174, 192, 0.2)'
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: 'rgba(160, 174, 192, 0.2)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
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

    function createTrendChart(trendData) {
        const ctx = document.getElementById('trendChart').getContext('2d');
        
        if (trendChart) {
            trendChart.destroy();
        }

        const categories = [...new Set(
            transactions
                .filter(t => t.amount < 0)
                .map(t => t.category)
        )];
        
        const datasets = categories.map((category, index) => {
            const colors = [
                'rgba(255, 99, 132, 1)', 'rgba(54, 162, 235, 1)', 
                'rgba(255, 206, 86, 1)', 'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)', 'rgba(255, 159, 64, 1)'
            ];
            
            return {
                label: category.charAt(0).toUpperCase() + category.slice(1),
                data: trendData[category] || [],
                borderColor: colors[index % colors.length],
                tension: 0.1,
                fill: false
            };
        });

        const textColor = '#f7fafc';

        trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            color: 'rgba(160, 174, 192, 0.2)'
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: 'rgba(160, 174, 192, 0.2)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
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

    function createBudgetComparisonChart(budgetData) {
        const ctx = document.getElementById('budgetComparisonChart').getContext('2d');
        
        if (budgetComparisonChart) {
            budgetComparisonChart.destroy();
        }

        const categories = Object.keys(budgetData);
        const actualData = categories.map(category => budgetData[category].actual);
        const budgetedData = categories.map(category => budgetData[category].budget);
        
        const textColor = '#f7fafc';

        budgetComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
                datasets: [
                    {
                        label: 'Actual',
                        data: actualData,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Budget',
                        data: budgetedData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: textColor,
                            callback: function(value) {
                                return formatCurrency(value);
                            }
                        },
                        grid: {
                            color: 'rgba(160, 174, 192, 0.2)'
                        }
                    },
                    x: {
                        ticks: {
                            color: textColor
                        },
                        grid: {
                            color: 'rgba(160, 174, 192, 0.2)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: {
                            color: textColor
                        }
                    },
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
        const expensesByCategory = {};
        const monthlyExpenses = new Array(12).fill(0);
        const trendData = {};
        const budgetComparisonData = {};

        categories.forEach(category => {
            if (category !== 'income') {
                trendData[category] = new Array(12).fill(0);
            }
        });
        
        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            const transactionMonth = new Date(transaction.date).getMonth();
            
            if (amount < 0) {
                const category = transaction.category;
                const absAmount = Math.abs(amount);
                
                if (matchesFilter(transaction) && matchesSearch(transaction)) {
                    expensesByCategory[category] = (expensesByCategory[category] || 0) + absAmount;
                }
                
                monthlyExpenses[transactionMonth] += absAmount;
                
                if (trendData[category]) {
                    trendData[category][transactionMonth] += absAmount;
                }
                
                if (transactionMonth === parseInt(monthSelect.value)) {
                    if (!budgetComparisonData[category]) {
                        budgetComparisonData[category] = {
                            actual: 0,
                            budget: budgetLimits[category] || 0
                        };
                    }
                    budgetComparisonData[category].actual += absAmount;
                }
            }
        });

        createExpensePieChart(expensesByCategory);
        createMonthlyExpensesChart(monthlyExpenses);
        createTrendChart(trendData);
        createBudgetComparisonChart(budgetComparisonData);
    }

    function addMonthlyIncomeTransaction(month) {
        const year = new Date().getFullYear();
        let paymentDate = new Date(year, month, 25);
        const dayOfWeek = paymentDate.getDay();
        if (dayOfWeek === 0) { 
            paymentDate.setDate(24); 
        } else if (dayOfWeek === 6) { 
            paymentDate.setDate(24); 
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
        
        processRecurringTransactions();
        
        const filteredTransactions = transactions.filter(transaction => 
            matchesFilter(transaction) && matchesSearch(transaction)
        );

        filteredTransactions.forEach(transaction => {
            const li = document.createElement("li");
            const formattedDate = formatDate(transaction.date);
            const amount = parseFloat(transaction.amount);
            const formattedAmount = formatCurrency(Math.abs(amount));
            const isIncome = amount > 0;
            const isMonthlyIncome = transaction.id.toString().startsWith('monthly-income-');
            const isRecurring = transaction.recurring;
            
            const category = transaction.category;
            const currentMonth = new Date(transaction.date).getMonth();
            let budgetWarning = "";
            
            if (!isIncome && budgetLimits[category] && currentMonth === selectedMonth) {
                const categoryTotal = transactions
                    .filter(t => 
                        t.category === category && 
                        new Date(t.date).getMonth() === currentMonth &&
                        t.amount < 0
                    )
                    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);
                
                const limit = budgetLimits[category];
                const percentUsed = (categoryTotal / limit) * 100;
                
                if (percentUsed >= 100) {
                    budgetWarning = `<div class="budget-warning budget-exceeded">Budget exceeded! (${formatCurrency(categoryTotal)} / ${formatCurrency(limit)})</div>`;
                } else if (percentUsed >= 80) {
                    budgetWarning = `<div class="budget-warning">Approaching budget limit (${Math.round(percentUsed)}% used)</div>`;
                }
            }
            
            li.innerHTML = `
                <div class="transaction-info">
                    <span class="transaction-desc">${transaction.desc} ${isRecurring ? '(Recurring)' : ''}</span>
                    <span class="transaction-date">${formattedDate}</span>
                    ${budgetWarning}
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

        updateCharts();
    }
    
    function processRecurringTransactions() {
        const today = new Date();
        
        recurringTransactions.forEach(recTrans => {
            const lastCreated = new Date(recTrans.lastCreated);
            let nextDate = new Date(lastCreated);
            
            switch (recTrans.frequency) {
                case 'weekly':
                    nextDate.setDate(nextDate.getDate() + 7);
                    break;
                case 'monthly':
                    const dayOfMonth = lastCreated.getDate();
                    nextDate.setMonth(nextDate.getMonth() + 1);
                    
                    const newMonth = nextDate.getMonth();
                    if (nextDate.getDate() !== dayOfMonth) {
                        nextDate.setDate(0);
                    }
                    break;
                case 'quarterly':
                    const quarterlyDayOfMonth = lastCreated.getDate();
                    nextDate.setMonth(nextDate.getMonth() + 3);
                    
                    if (nextDate.getDate() !== quarterlyDayOfMonth) {
                        nextDate.setDate(0);
                    }
                    break;
                case 'yearly':
                    nextDate.setFullYear(nextDate.getFullYear() + 1);
                    break;
            }
            
            while (nextDate <= today) {
                const newTransaction = {
                    id: Date.now() + Math.random().toString(36).substr(2, 5),
                    desc: recTrans.desc,
                    amount: recTrans.amount,
                    category: recTrans.category,
                    date: nextDate.toISOString(),
                    recurring: true
                };
                
                transactions.push(newTransaction);
                
                recTrans.lastCreated = nextDate.toISOString();
                
                switch (recTrans.frequency) {
                    case 'weekly':
                        nextDate.setDate(nextDate.getDate() + 7);
                        break;
                    case 'monthly':
                        const dayOfMonth = new Date(recTrans.lastCreated).getDate();
                        nextDate.setMonth(nextDate.getMonth() + 1);
                        
                        if (nextDate.getDate() !== dayOfMonth) {
                            nextDate.setDate(0);
                        }
                        break;
                    case 'quarterly':
                        const quarterlyDayOfMonth = new Date(recTrans.lastCreated).getDate();
                        nextDate.setMonth(nextDate.getMonth() + 3);
                        
                        if (nextDate.getDate() !== quarterlyDayOfMonth) {
                            nextDate.setDate(0);
                        }
                        break;
                    case 'yearly':
                        nextDate.setFullYear(nextDate.getFullYear() + 1);
                        break;
                }
            }
        });
        
        localStorage.setItem("recurringTransactions", JSON.stringify(recurringTransactions));
    }

    monthlyIncomeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const newMonthlyIncome = parseFloat(monthlyIncomeInput.value);
        
        transactions = transactions.filter(transaction => !transaction.id.toString().startsWith('monthly-income-'));
        
        monthlyIncome = newMonthlyIncome;
        localStorage.setItem("monthlyIncome", JSON.stringify(monthlyIncome));
        
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
        const isRecurring = isRecurringCheckbox.checked;
        const recurringFrequency = recurringFrequencySelect.value;

        if (!desc || isNaN(amount)) return;

        if (category !== "income") {
            amount = -Math.abs(amount);
        }

        const transactionDate = new Date(date);
        
        const transaction = {
            id: Date.now(),
            desc,
            amount,
            category,
            date: transactionDate.toISOString(),
            recurring: isRecurring
        };

        transactions.push(transaction);

        if (isRecurring) {
            const recurringTransaction = {
                desc,
                amount,
                category,
                frequency: recurringFrequency,
                lastCreated: transactionDate.toISOString(),
                startDate: transactionDate.toISOString()
            };
            
            recurringTransactions.push(recurringTransaction);
            localStorage.setItem("recurringTransactions", JSON.stringify(recurringTransactions));
        }

        updateUI();
        transactionForm.reset();
        dateInput.value = `${year}-${month}-${day}`;
    });

    window.removeTransaction = (id) => {
        if (!id.toString().startsWith('monthly-income-')) {
            transactions = transactions.filter(transaction => transaction.id.toString() !== id.toString());
            localStorage.setItem("transactions", JSON.stringify(transactions));
            updateUI();
        }
    };

    applyFilterBtn.addEventListener("click", () => {
        if (startDateInput.value || endDateInput.value) {
            isFilterActive = true;
            updateUI();
        }
    });

    resetFilterBtn.addEventListener("click", () => {
        startDateInput.value = "";
        endDateInput.value = "";
        isFilterActive = false;
        updateUI();
    });

    searchBtn.addEventListener("click", () => {
        searchTerm = searchInput.value.trim();
        updateUI();
    });

    searchInput.addEventListener("input", () => {
        if (searchInput.value.trim() === "") {
            searchTerm = "";
            updateUI();
        }
    });

    addCategoryBtn.addEventListener("click", () => {
        addCategory(newCategoryInput.value);
        newCategoryInput.value = "";
    });

    setLimitBtn.addEventListener("click", () => {
        const category = limitCategorySelect.value;
        const amount = parseFloat(limitAmountInput.value);
        if (category && !isNaN(amount) && amount > 0) {
            setBudgetLimit(category, amount);
            limitAmountInput.value = "";
        }
    });

    isRecurringCheckbox.addEventListener("change", () => {
        recurringFrequencySelect.disabled = !isRecurringCheckbox.checked;
    });

    monthSelect.addEventListener("change", updateUI);

    updateCategorySelects();
    updateCategoriesList();
    updateBudgetLimitsList();
    updateUI();
});
