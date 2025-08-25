// API endpoints
const API_URL = 'http://localhost:5000/api';

// DOM Elements
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const toggleAuthBtn = document.getElementById('toggle-auth');
const logoutBtn = document.getElementById('logout-btn');
const userNameEl = document.getElementById('user-name');
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
const recurringOptions = document.getElementById("recurring-options");

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            showApp(data.data.user);
        } else {
            showAuth();
        }
    } catch (err) {
        console.error('Error checking auth status:', err);
        showAuth();
    }
});

// Toggle between login and register forms
toggleAuthBtn.addEventListener('click', () => {
    const isLogin = !loginForm.classList.contains('hidden');
    loginForm.classList.toggle('hidden');
    registerForm.classList.toggle('hidden');
    toggleAuthBtn.textContent = isLogin ? 'Switch to Register' : 'Switch to Login';
});

// Login form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showApp(data.data.user);
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error('Login error:', err);
        alert('An error occurred during login');
    }
});

// Register form submission
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            showApp(data.data.user);
        } else {
            alert(data.message);
        }
    } catch (err) {
        console.error('Registration error:', err);
        alert('An error occurred during registration');
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await fetch(`${API_URL}/auth/logout`, {
            credentials: 'include'
        });
        showAuth();
    } catch (err) {
        console.error('Logout error:', err);
        alert('An error occurred during logout');
    }
});

// Show authentication forms
function showAuth() {
    authContainer.classList.remove('hidden');
    appContainer.classList.add('hidden');
}

// Show main application
function showApp(user) {
    authContainer.classList.add('hidden');
    appContainer.classList.remove('hidden');
    userNameEl.textContent = user.name;
    
    // Initialize the app
    initializeApp();
}

// Initialize the main application
function initializeApp() {
    // Set up event listeners and initialize components
    setupTransactionForm();
    setupMonthlyIncomeForm();
    setupCategoryManagement();
    setupBudgetLimits();
    setupTransactionList();
    setupCharts();
    
    // Load initial data
    updateUI();
}

// Transaction form handling
function setupTransactionForm() {
    const form = document.getElementById('transaction-form');
    const isRecurringCheckbox = document.getElementById('is-recurring');
    const recurringFrequencySelect = document.getElementById('recurring-frequency');
    
    isRecurringCheckbox.addEventListener('change', () => {
        recurringFrequencySelect.disabled = !isRecurringCheckbox.checked;
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            description: document.getElementById('desc').value,
            amount: parseFloat(document.getElementById('amount').value),
            category: document.getElementById('category').value,
            date: document.getElementById('date').value,
            isRecurring: isRecurringCheckbox.checked,
            recurringFrequency: isRecurringCheckbox.checked ? recurringFrequencySelect.value : null
        };
        
        try {
            const response = await fetch(`${API_URL}/transactions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                form.reset();
                updateUI();
            } else {
                const data = await response.json();
                alert(data.message);
            }
        } catch (err) {
            console.error('Error adding transaction:', err);
            alert('An error occurred while adding the transaction');
        }
    });
}

// Monthly income form handling
function setupMonthlyIncomeForm() {
    const form = document.getElementById('monthly-income-form');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const amount = parseFloat(document.getElementById('monthly-income').value);
        
        try {
            const response = await fetch(`${API_URL}/users/me`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ monthlyIncome: amount })
            });
            
            if (response.ok) {
                updateUI();
            } else {
                const data = await response.json();
                alert(data.message);
            }
        } catch (err) {
            console.error('Error updating monthly income:', err);
            alert('An error occurred while updating monthly income');
        }
    });
}

// Category management
function setupCategoryManagement() {
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category');
    
    addCategoryBtn.addEventListener('click', async () => {
        const category = newCategoryInput.value.trim();
        
        if (!category) return;
        
        try {
            const response = await fetch(`${API_URL}/users/me/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ category })
            });
            
            if (response.ok) {
                newCategoryInput.value = '';
                updateUI();
            } else {
                const data = await response.json();
                alert(data.message);
            }
        } catch (err) {
            console.error('Error adding category:', err);
            alert('An error occurred while adding the category');
        }
    });
}

// Budget limits management
function setupBudgetLimits() {
    const setLimitBtn = document.getElementById('set-limit-btn');
    
    setLimitBtn.addEventListener('click', async () => {
        const category = document.getElementById('limit-category').value;
        const limit = parseFloat(document.getElementById('limit-amount').value);
        
        if (!category || isNaN(limit) || limit <= 0) return;
        
        try {
            const response = await fetch(`${API_URL}/budgets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    category,
                    limit,
                    month: new Date().getMonth(),
                    year: new Date().getFullYear()
                })
            });
            
            if (response.ok) {
                document.getElementById('limit-amount').value = '';
                updateUI();
            } else {
                const data = await response.json();
                alert(data.message);
            }
        } catch (err) {
            console.error('Error setting budget limit:', err);
            alert('An error occurred while setting the budget limit');
        }
    });
}

// Transaction list and search
function setupTransactionList() {
    const searchBtn = document.getElementById('search-btn');
    const searchInput = document.getElementById('search-input');
    const monthSelect = document.getElementById('month-select');
    
    searchBtn.addEventListener('click', updateUI);
    searchInput.addEventListener('input', debounce(updateUI, 300));
    monthSelect.addEventListener('change', updateUI);
}

// Update UI with latest data
async function updateUI() {
    try {
        // Get transactions
        const transactionsResponse = await fetch(`${API_URL}/transactions`, {
            credentials: 'include'
        });
        const transactionsData = await transactionsResponse.json();
        
        // Get budgets
        const budgetsResponse = await fetch(`${API_URL}/budgets`, {
            credentials: 'include'
        });
        const budgetsData = await budgetsResponse.json();
        
        // Get user data
        const userResponse = await fetch(`${API_URL}/auth/me`, {
            credentials: 'include'
        });
        const userData = await userResponse.json();
        
        // Update UI components
        updateTransactionList(transactionsData.data.transactions);
        updateBudgetLimitsList(budgetsData.data.budgets);
        updateCategoriesList(userData.data.user.categories);
        updateCharts(transactionsData.data.transactions, budgetsData.data.budgets);
        updateBalanceOverview(transactionsData.data.transactions);
    } catch (err) {
        console.error('Error updating UI:', err);
        alert('An error occurred while updating the UI');
    }
}

// Update transaction list
function updateTransactionList(transactions) {
    const list = document.getElementById('transaction-list');
    list.innerHTML = '';
    
    transactions.forEach(transaction => {
        const li = document.createElement('li');
        li.className = 'flex justify-between items-center p-4 bg-gray-700 rounded-lg';
        
        const formattedDate = new Date(transaction.date).toLocaleDateString();
        const formattedAmount = new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF'
        }).format(Math.abs(transaction.amount));
        
        li.innerHTML = `
            <div class="transaction-info">
                <span class="transaction-desc">${transaction.description}</span>
                <span class="transaction-date">${formattedDate}</span>
            </div>
            <div class="transaction-amount ${transaction.amount >= 0 ? 'income' : 'expense'}">
                ${transaction.amount >= 0 ? '+' : '-'}${formattedAmount}
                <button onclick="deleteTransaction('${transaction._id}')">×</button>
            </div>
        `;
        
        list.appendChild(li);
    });
}

// Update budget limits list
function updateBudgetLimitsList(budgets) {
    const list = document.getElementById('budget-limits-list');
    list.innerHTML = '';
    
    budgets.forEach(budget => {
        const li = document.createElement('li');
        const formattedLimit = new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF'
        }).format(budget.limit);
        
        const spendingPercentage = (budget.spending / budget.limit) * 100;
        const warningClass = spendingPercentage >= 100 ? 'budget-exceeded' : '';
        
        li.innerHTML = `
            <span>${budget.category}: ${formattedLimit}</span>
            <div class="budget-item-controls">
                <span class="budget-warning ${warningClass}">${Math.round(spendingPercentage)}% used</span>
                <button class="delete-limit" onclick="deleteBudgetLimit('${budget._id}')">×</button>
            </div>
        `;
        
        list.appendChild(li);
    });
}

// Update categories list
function updateCategoriesList(categories) {
    const list = document.getElementById('categories-list');
    list.innerHTML = '';
    
    categories.forEach(category => {
        if (category.toLowerCase() === 'income') return;
        
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${category}</span>
            <div class="category-item-controls">
                <button class="delete-category" onclick="deleteCategory('${category}')">×</button>
            </div>
        `;
        
        list.appendChild(li);
    });
    
    // Update category selects
    updateCategorySelects(categories);
}

// Update category selects
function updateCategorySelects(categories) {
    const categorySelect = document.getElementById('category');
    const limitCategorySelect = document.getElementById('limit-category');
    
    categorySelect.innerHTML = categories.map(category => 
        `<option value="${category}">${category}</option>`
    ).join('');
    
    limitCategorySelect.innerHTML = categories
        .filter(category => category.toLowerCase() !== 'income')
        .map(category => 
            `<option value="${category}">${category}</option>`
        ).join('');
}

// Update balance overview
function updateBalanceOverview(transactions) {
    const balance = transactions.reduce((sum, t) => sum + t.amount, 0);
    const income = transactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    document.getElementById('balance').textContent = formatCurrency(balance);
    document.getElementById('income').textContent = formatCurrency(income);
    document.getElementById('expenses').textContent = formatCurrency(expenses);
}

// Update charts
function updateCharts(transactions, budgets) {
    updateExpensePieChart(transactions);
    updateMonthlyExpensesChart(transactions);
    updateTrendChart(transactions);
    updateBudgetComparisonChart(transactions, budgets);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('de-CH', {
        style: 'currency',
        currency: 'CHF'
    }).format(amount);
}

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Delete transaction
async function deleteTransaction(id) {
    try {
        const response = await fetch(`${API_URL}/transactions/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            updateUI();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (err) {
        console.error('Error deleting transaction:', err);
        alert('An error occurred while deleting the transaction');
    }
}

// Delete category
async function deleteCategory(category) {
    try {
        const response = await fetch(`${API_URL}/users/me/categories/${category}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            updateUI();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (err) {
        console.error('Error deleting category:', err);
        alert('An error occurred while deleting the category');
    }
}

// Delete budget limit
async function deleteBudgetLimit(id) {
    try {
        const response = await fetch(`${API_URL}/budgets/${id}`, {
            method: 'DELETE',
            credentials: 'include'
        });
        
        if (response.ok) {
            updateUI();
        } else {
            const data = await response.json();
            alert(data.message);
        }
    } catch (err) {
        console.error('Error deleting budget limit:', err);
        alert('An error occurred while deleting the budget limit');
    }
}

// Chart functions
let expensePieChart = null;
let monthlyExpensesChart = null;
let trendChart = null;
let budgetComparisonChart = null;

function updateExpensePieChart(transactions) {
    const expensesByCategory = {};
    
    transactions
        .filter(t => t.amount < 0)
        .forEach(t => {
            expensesByCategory[t.category] = (expensesByCategory[t.category] || 0) + Math.abs(t.amount);
        });
    
    const ctx = document.getElementById('expensePieChart').getContext('2d');
    
    if (expensePieChart) {
        expensePieChart.destroy();
    }
    
    expensePieChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(expensesByCategory),
            datasets: [{
                data: Object.values(expensesByCategory),
                backgroundColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                }
            }
        }
    });
}

function updateMonthlyExpensesChart(transactions) {
    const monthlyExpenses = new Array(12).fill(0);
    
    transactions
        .filter(t => t.amount < 0)
        .forEach(t => {
            const month = new Date(t.date).getMonth();
            monthlyExpenses[month] += Math.abs(t.amount);
        });
    
    const ctx = document.getElementById('monthlyExpensesChart').getContext('2d');
    
    if (monthlyExpensesChart) {
        monthlyExpensesChart.destroy();
    }
    
    monthlyExpensesChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ],
            datasets: [{
                label: 'Monthly Expenses',
                data: monthlyExpenses,
                backgroundColor: '#36A2EB'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateTrendChart(transactions) {
    const categories = [...new Set(
        transactions
            .filter(t => t.amount < 0)
            .map(t => t.category)
    )];
    
    const monthlyData = {};
    categories.forEach(category => {
        monthlyData[category] = new Array(12).fill(0);
    });
    
    transactions
        .filter(t => t.amount < 0)
        .forEach(t => {
            const month = new Date(t.date).getMonth();
            monthlyData[t.category][month] += Math.abs(t.amount);
        });
    
    const ctx = document.getElementById('trendChart').getContext('2d');
    
    if (trendChart) {
        trendChart.destroy();
    }
    
    trendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [
                'January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'
            ],
            datasets: categories.map((category, index) => ({
                label: category,
                data: monthlyData[category],
                borderColor: [
                    '#FF6384',
                    '#36A2EB',
                    '#FFCE56',
                    '#4BC0C0',
                    '#9966FF',
                    '#FF9F40'
                ][index % 6],
                fill: false
            }))
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function updateBudgetComparisonChart(transactions, budgets) {
    const categories = budgets.map(b => b.category);
    const actualData = categories.map(category => {
        return transactions
            .filter(t => t.category === category && t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    });
    const budgetData = budgets.map(b => b.limit);
    
    const ctx = document.getElementById('budgetComparisonChart').getContext('2d');
    
    if (budgetComparisonChart) {
        budgetComparisonChart.destroy();
    }
    
    budgetComparisonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: categories,
            datasets: [
                {
                    label: 'Actual',
                    data: actualData,
                    backgroundColor: '#FF6384'
                },
                {
                    label: 'Budget',
                    data: budgetData,
                    backgroundColor: '#36A2EB'
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
} 