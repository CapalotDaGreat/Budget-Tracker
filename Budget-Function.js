document.addEventListener("DOMContentLoaded", () => {
	// Elements
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

	// Charts
	let expensePieChart = null;
	let monthlyExpensesChart = null;
	let trendChart = null;
	let budgetComparisonChart = null;

	// Defaults
	const today = new Date();
	const year = today.getFullYear();
	const month = String(today.getMonth() + 1).padStart(2, "0");
	const day = String(today.getDate()).padStart(2, "0");
	dateInput.value = `${year}-${month}-${day}`;

	// State (localStorage)
	let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
	let monthlyIncome = Number(localStorage.getItem("monthlyIncome") || 0);
	let categories = JSON.parse(localStorage.getItem("categories")) || [
		"income",
		"food",
		"rent",
		"entertainment",
		"tax"
	];
	let budgetLimits = JSON.parse(localStorage.getItem("budgetLimits")) || {};
	let recurringTransactions = JSON.parse(localStorage.getItem("recurringTransactions")) || [];
	let isFilterActive = false;
	let searchTerm = "";

	// Utils
	const formatCurrency = amount =>
		new Intl.NumberFormat("de-CH", { style: "currency", currency: "CHF" }).format(amount);

	const formatDate = iso => {
		const d = new Date(iso);
		return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
	};

	const months = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December"
	];
	months.forEach((m, idx) => {
		const o = document.createElement("option");
		o.value = idx;
		o.textContent = m;
		if (idx === today.getMonth()) o.selected = true;
		monthSelect.appendChild(o);
	});
	monthlyIncomeInput.value = String(monthlyIncome || "");

	function persist() {
		localStorage.setItem("transactions", JSON.stringify(transactions));
		localStorage.setItem("monthlyIncome", String(monthlyIncome));
		localStorage.setItem("categories", JSON.stringify(categories));
		localStorage.setItem("budgetLimits", JSON.stringify(budgetLimits));
		localStorage.setItem("recurringTransactions", JSON.stringify(recurringTransactions));
	}

	function updateCategorySelects() {
		categoryInput.innerHTML = "";
		limitCategorySelect.innerHTML = "";
		categories.forEach(cat => {
			const o = document.createElement("option");
			o.value = cat.toLowerCase();
			o.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
			categoryInput.appendChild(o);
		});
		categories
			.filter(cat => cat.toLowerCase() !== "income")
			.forEach(cat => {
				const o = document.createElement("option");
				o.value = cat.toLowerCase();
				o.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
				limitCategorySelect.appendChild(o);
			});
	}

	function updateCategoriesList() {
		categoriesList.innerHTML = "";
		categories.forEach(cat => {
			if (cat.toLowerCase() === "income") return;
			const li = document.createElement("li");
			li.className = "category-item";
			li.innerHTML = `
				<span>${cat.charAt(0).toUpperCase() + cat.slice(1)}</span>
				<div class="category-controls">
					<button class="btn btn-danger" data-cat="${cat}">Delete</button>
				</div>
			`;
			li.querySelector("button").addEventListener("click", () => {
				deleteCategory(cat);
			});
			categoriesList.appendChild(li);
		});
	}

	function updateBudgetLimitsList() {
		budgetLimitsList.innerHTML = "";
		Object.keys(budgetLimits).forEach(cat => {
			const li = document.createElement("li");
			li.className = "category-item";
			const spent = transactions
				.filter(t => t.category === cat && t.amount < 0 && new Date(t.date).getMonth() === Number(monthSelect.value))
				.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
			const limit = Number(budgetLimits[cat] || 0);
			const warn = limit > 0 ? (spent / limit) * 100 : 0;
			const warnHtml =
				limit > 0
					? `<div class="budget-warning ${warn >= 100 ? "budget-exceeded" : ""}">${Math.min(100, Math.round(warn))}% used</div>`
					: "";
			li.innerHTML = `
				<div>
					<span>${cat.charAt(0).toUpperCase() + cat.slice(1)}: ${formatCurrency(limit)}</span>
					${warnHtml}
				</div>
				<div class="category-controls">
					<button class="btn btn-danger" data-cat="${cat}">Delete</button>
				</div>
			`;
			li.querySelector("button").addEventListener("click", () => deleteBudgetLimit(cat));
			budgetLimitsList.appendChild(li);
		});
	}

	function addCategory(name) {
		const cat = name.trim().toLowerCase();
		if (!cat || categories.includes(cat)) return;
		categories.push(cat);
		persist();
		updateCategorySelects();
		updateCategoriesList();
	}

	function deleteCategory(cat) {
		if (cat.toLowerCase() === "income") return;
		categories = categories.filter(c => c !== cat);
		if (budgetLimits[cat]) delete budgetLimits[cat];
		persist();
		updateCategorySelects();
		updateCategoriesList();
		updateBudgetLimitsList();
		updateUI();
	}

	function setBudgetLimit(cat, amount) {
		if (!cat || cat === "income" || !(amount > 0)) return;
		budgetLimits[cat] = Number(amount);
		persist();
		updateBudgetLimitsList();
		updateUI();
	}

	function deleteBudgetLimit(cat) {
		if (budgetLimits[cat]) {
			delete budgetLimits[cat];
			persist();
			updateBudgetLimitsList();
			updateUI();
		}
	}

	function matchesFilter(t) {
		const d = new Date(t.date);
		const selectedMonth = Number(monthSelect.value);
		if (!isFilterActive) return d.getMonth() === selectedMonth;
		const start = startDateInput.value ? new Date(startDateInput.value) : null;
		const end = endDateInput.value ? new Date(endDateInput.value) : null;
		if (start && end) return d >= start && d <= end;
		if (start) return d >= start;
		if (end) return d <= end;
		return true;
	}

	function matchesSearch(t) {
		if (!searchTerm) return true;
		const q = searchTerm.toLowerCase();
		return t.desc.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
	}

	function createExpensePieChart(expensesByCategory) {
		const ctx = document.getElementById("expensePieChart").getContext("2d");
		if (expensePieChart) expensePieChart.destroy();
		const colors = ["#2563eb", "#f43f5e", "#10b981", "#f59e0b", "#8b5cf6", "#14b8a6", "#ef4444", "#22c55e"];
		const labels = Object.keys(expensesByCategory);
		const data = labels.map(l => expensesByCategory[l]);
		expensePieChart = new Chart(ctx, {
			type: "pie",
			data: {
				labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
				datasets: [{ data, backgroundColor: labels.map((_, i) => colors[i % colors.length]) }]
			},
			options: { responsive: true, plugins: { legend: { position: "right" } } }
		});
	}

	function createMonthlyExpensesChart(monthlyExpenses) {
		const ctx = document.getElementById("monthlyExpensesChart").getContext("2d");
		if (monthlyExpensesChart) monthlyExpensesChart.destroy();
		const nonZero = monthlyExpenses.filter(v => v > 0);
		const avg = nonZero.length ? nonZero.reduce((a, b) => a + b, 0) / nonZero.length : 0;
		monthlyExpensesChart = new Chart(ctx, {
			type: "bar",
			data: {
				labels: months,
				datasets: [
					{ label: "Monthly Expenses", data: monthlyExpenses, backgroundColor: "#60a5fa" },
					{ label: "Average", data: monthlyExpenses.map(() => avg), type: "line", borderColor: "#f43f5e", borderDash: [6, 6], pointRadius: 0 }
				]
			},
			options: { responsive: true, scales: { y: { beginAtZero: true } } }
		});
	}

	function createTrendChart(trendData) {
		const ctx = document.getElementById("trendChart").getContext("2d");
		if (trendChart) trendChart.destroy();
		const cats = Object.keys(trendData);
		const colors = ["#f43f5e", "#2563eb", "#22c55e", "#f59e0b", "#8b5cf6", "#14b8a6"];
		trendChart = new Chart(ctx, {
			type: "line",
			data: {
				labels: months,
				datasets: cats.map((c, i) => ({ label: c.charAt(0).toUpperCase() + c.slice(1), data: trendData[c], borderColor: colors[i % colors.length], tension: 0.25, fill: false }))
			},
			options: { responsive: true, scales: { y: { beginAtZero: true } } }
		});
	}

	function createBudgetComparisonChart(budgetData) {
		const ctx = document.getElementById("budgetComparisonChart").getContext("2d");
		if (budgetComparisonChart) budgetComparisonChart.destroy();
		const cats = Object.keys(budgetData);
		budgetComparisonChart = new Chart(ctx, {
			type: "bar",
			data: {
				labels: cats.map(c => c.charAt(0).toUpperCase() + c.slice(1)),
				datasets: [
					{ label: "Actual", data: cats.map(c => budgetData[c].actual), backgroundColor: "#f43f5e" },
					{ label: "Budget", data: cats.map(c => budgetData[c].budget), backgroundColor: "#22c55e" }
				]
			},
			options: { responsive: true, scales: { y: { beginAtZero: true } } }
		});
	}

	function updateCharts() {
		const expensesByCategory = {};
		const monthlyExpenses = new Array(12).fill(0);
		const trendData = {};
		const budgetCmp = {};
		categories.forEach(c => {
			if (c !== "income") trendData[c] = new Array(12).fill(0);
		});
		transactions.forEach(t => {
			const amt = Number(t.amount);
			const m = new Date(t.date).getMonth();
			if (amt < 0) {
				const cat = t.category;
				const abs = Math.abs(amt);
				if (matchesFilter(t) && matchesSearch(t)) expensesByCategory[cat] = (expensesByCategory[cat] || 0) + abs;
				monthlyExpenses[m] += abs;
				if (trendData[cat]) trendData[cat][m] += abs;
				if (m === Number(monthSelect.value)) {
					if (!budgetCmp[cat]) budgetCmp[cat] = { actual: 0, budget: Number(budgetLimits[cat] || 0) };
					budgetCmp[cat].actual += abs;
				}
			}
		});
		createExpensePieChart(expensesByCategory);
		createMonthlyExpensesChart(monthlyExpenses);
		createTrendChart(trendData);
		createBudgetComparisonChart(budgetCmp);
	}

	function addMonthlyIncomeTransaction(m) {
		const y = new Date().getFullYear();
		let pay = new Date(y, m, 25);
		const dow = pay.getDay();
		if (dow === 0) pay.setDate(24);
		else if (dow === 6) pay.setDate(24);
		if (!transactions.find(t => t.desc === "Monthly Income" && new Date(t.date).getMonth() === m && new Date(t.date).getFullYear() === y) && monthlyIncome > 0) {
			transactions.push({ id: `monthly-income-${m}-${y}`, desc: "Monthly Income", amount: Number(monthlyIncome), category: "income", date: pay.toISOString() });
			persist();
		}
	}

	function processRecurringTransactions() {
		const now = new Date();
		recurringTransactions.forEach(rt => {
			let next = new Date(rt.lastCreated || rt.startDate || now);
			while (next <= now) {
				transactions.push({ id: Date.now() + Math.random().toString(36).slice(2, 6), desc: rt.desc, amount: rt.amount, category: rt.category, date: next.toISOString(), recurring: true });
				switch (rt.frequency) {
					case "weekly":
						next.setDate(next.getDate() + 7);
						break;
					case "monthly": {
						const dom = new Date(rt.lastCreated || rt.startDate || now).getDate();
						next.setMonth(next.getMonth() + 1);
						if (next.getDate() !== dom) next.setDate(0);
						break;
					}
					case "quarterly": {
						const dom = new Date(rt.lastCreated || rt.startDate || now).getDate();
						next.setMonth(next.getMonth() + 3);
						if (next.getDate() !== dom) next.setDate(0);
						break;
					}
					case "yearly":
						next.setFullYear(next.getFullYear() + 1);
						break;
				}
				rt.lastCreated = next.toISOString();
			}
		});
		persist();
	}

	function updateUI() {
		let income = 0;
		let expenses = 0;
		transactionList.innerHTML = "";
		const selectedMonth = Number(monthSelect.value);
		addMonthlyIncomeTransaction(selectedMonth);
		processRecurringTransactions();
		const filtered = transactions.filter(t => matchesFilter(t) && matchesSearch(t));
		filtered.forEach(t => {
			const li = document.createElement("li");
			li.className = "transaction-item";
			const amt = Number(t.amount);
			const isIncome = amt > 0;
			const formattedAmount = formatCurrency(Math.abs(amt));
			const isMonthlyIncome = t.id.toString().startsWith("monthly-income-");
			let warnHtml = "";
			if (!isIncome) {
				const cat = t.category;
				const m = new Date(t.date).getMonth();
				if (budgetLimits[cat] && m === selectedMonth) {
					const totalCat = transactions
						.filter(x => x.category === cat && new Date(x.date).getMonth() === m && x.amount < 0)
						.reduce((s, x) => s + Math.abs(Number(x.amount)), 0);
					const limit = Number(budgetLimits[cat] || 0);
					const pct = limit ? (totalCat / limit) * 100 : 0;
					if (pct >= 100) warnHtml = `<div class="budget-warning budget-exceeded">Budget exceeded! (${formatCurrency(totalCat)} / ${formatCurrency(limit)})</div>`;
					else if (pct >= 80) warnHtml = `<div class="budget-warning">Approaching budget limit (${Math.round(pct)}% used)</div>`;
				}
			}
			li.innerHTML = `
				<div class="transaction-info">
					<span class="transaction-desc">${t.desc}${t.recurring ? " (Recurring)" : ""}</span>
					<span class="transaction-date">${formatDate(t.date)}</span>
					${warnHtml}
				</div>
				<span class="transaction-amount ${isIncome ? "income" : "expense"}">${isIncome ? "+" : "-"}${formattedAmount}</span>
				${!isMonthlyIncome ? `<button class="btn btn-danger" data-id="${t.id}">Delete</button>` : ""}
			`;
			const del = li.querySelector("button.btn-danger");
			if (del) del.addEventListener("click", () => removeTransaction(t.id));
			transactionList.appendChild(li);
			if (isIncome) income += amt; else expenses += Math.abs(amt);
		});
		balanceEl.textContent = formatCurrency(income - expenses);
		incomeEl.textContent = formatCurrency(income);
		expensesEl.textContent = formatCurrency(expenses);
		persist();
		updateCharts();
	}

	function removeTransaction(id) {
		if (!id.toString().startsWith("monthly-income-")) {
			transactions = transactions.filter(t => t.id.toString() !== id.toString());
			persist();
			updateUI();
		}
	}
	window.removeTransaction = removeTransaction;

	// Events
	monthlyIncomeForm.addEventListener("submit", e => {
		e.preventDefault();
		const val = Number(monthlyIncomeInput.value);
		monthlyIncome = isNaN(val) ? 0 : val;
		transactions = transactions.filter(t => !t.id.toString().startsWith("monthly-income-"));
		for (let m = 0; m < 12; m++) addMonthlyIncomeTransaction(m);
		persist();
		updateUI();
	});

	transactionForm.addEventListener("submit", e => {
		e.preventDefault();
		const desc = descInput.value.trim();
		let amt = Number(amountInput.value);
		const cat = categoryInput.value.toLowerCase();
		const date = dateInput.value;
		const isRec = isRecurringCheckbox.checked;
		const freq = recurringFrequencySelect.value;
		if (!desc || isNaN(amt)) return;
		if (cat !== "income") amt = -Math.abs(amt);
		const d = new Date(date);
		const tx = { id: Date.now(), desc, amount: amt, category: cat, date: d.toISOString(), recurring: isRec };
		transactions.push(tx);
		if (isRec) {
			recurringTransactions.push({ desc, amount: amt, category: cat, frequency: freq, lastCreated: d.toISOString(), startDate: d.toISOString() });
		}
		persist();
		transactionForm.reset();
		dateInput.value = `${year}-${month}-${day}`;
		updateUI();
	});

	addCategoryBtn.addEventListener("click", () => {
		addCategory(newCategoryInput.value);
		newCategoryInput.value = "";
	});

	setLimitBtn.addEventListener("click", () => {
		const cat = limitCategorySelect.value;
		const amt = Number(limitAmountInput.value);
		setBudgetLimit(cat, amt);
		limitAmountInput.value = "";
	});

	isRecurringCheckbox.addEventListener("change", () => {
		recurringOptions.style.display = isRecurringCheckbox.checked ? "block" : "none";
		recurringFrequencySelect.disabled = !isRecurringCheckbox.checked;
	});

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
		if (!searchInput.value.trim()) {
			searchTerm = "";
			updateUI();
		}
	});

	// Init
	updateCategorySelects();
	updateCategoriesList();
	updateBudgetLimitsList();
	updateUI();
});
