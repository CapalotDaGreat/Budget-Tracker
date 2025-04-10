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
    const monthSelect = document.createElement("select");

    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).split('/').reverse().join('-');
    dateInput.value = formattedDate;

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('de-CH', {
            style: 'currency',
            currency: 'CHF'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((month, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    document.querySelector(".container").insertBefore(monthSelect, transactionList);

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
    let monthlyIncome = JSON.parse(localStorage.getItem("monthlyIncome")) || 0;
    monthlyIncomeInput.value = monthlyIncome;

    function addMonthlyIncomeTransaction(month) {
        const year = new Date().getFullYear();
        const firstDayOfMonth = new Date(year, month, 1).toISOString();

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
                date: firstDayOfMonth
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
            li.innerHTML = `${transaction.desc} - ${formatCurrency(parseFloat(transaction.amount))} (${formattedDate})
                <button onclick="removeTransaction(${transaction.id})">X</button>`;
            transactionList.appendChild(li);

            if (transaction.amount > 0) {
                income += parseFloat(transaction.amount);
            } else {
                expenses += Math.abs(parseFloat(transaction.amount));
            }
        });

        const balance = income - expenses;

        balanceEl.textContent = formatCurrency(balance);
        incomeEl.textContent = formatCurrency(income);
        expensesEl.textContent = formatCurrency(expenses);
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }

    monthlyIncomeForm.addEventListener("submit", (e) => {
        e.preventDefault();
        monthlyIncome = parseFloat(monthlyIncomeInput.value);
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
        const date = new Date(dateInput.value).toISOString();

        if (!desc || isNaN(amount)) return;

        if (category !== "income") {
            amount = Math.abs(amount) * -1;
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
        dateInput.value = formattedDate;
    });

    window.removeTransaction = (id) => {
        if (!id.toString().startsWith('monthly-income-')) {
            transactions = transactions.filter(transaction => transaction.id !== id);
            updateUI();
        }
    };

    monthSelect.addEventListener("change", updateUI);

    updateUI();
});
