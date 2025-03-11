document.addEventListener("DOMContentLoaded", () => {
    const balanceEl = document.getElementById("balance");
    const incomeEl = document.getElementById("income");
    const expensesEl = document.getElementById("expenses");
    const transactionForm = document.getElementById("transaction-form");
    const transactionList = document.getElementById("transaction-list");
    const descInput = document.getElementById("desc");
    const amountInput = document.getElementById("amount");
    const categoryInput = document.getElementById("category");
    const monthSelect = document.createElement("select");

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach((month, index) => {
        let option = document.createElement("option");
        option.value = index;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
    document.querySelector(".container").insertBefore(monthSelect, transactionList);

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    function updateUI() {
        let income = 0, expenses = 0;
        transactionList.innerHTML = "";

        const selectedMonth = parseInt(monthSelect.value);
        const filteredTransactions = transactions.filter(transaction => new Date(transaction.date).getMonth() === selectedMonth);

        filteredTransactions.forEach(transaction => {
            const li = document.createElement("li");
            li.innerHTML = `${transaction.desc} - $${parseFloat(transaction.amount).toFixed(2)} 
                <button onclick="removeTransaction(${transaction.id})">X</button>`;
            transactionList.appendChild(li);

            if (transaction.amount > 0) {
                income += parseFloat(transaction.amount);
            } else {
                expenses += Math.abs(parseFloat(transaction.amount));
            }
        });

        const balance = income - expenses;

        balanceEl.textContent = `$${balance.toFixed(2)}`;
        incomeEl.textContent = `$${income.toFixed(2)}`;
        expensesEl.textContent = `$${expenses.toFixed(2)}`;
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }

    transactionForm.addEventListener("submit", (e) => {
        e.preventDefault();

        const desc = descInput.value.trim();
        let amount = parseFloat(amountInput.value.trim());
        const category = categoryInput.value.toLowerCase();
        const date = new Date().toISOString();

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
    });

    window.removeTransaction = (id) => {
        transactions = transactions.filter(transaction => transaction.id !== id);
        updateUI();
    };

    monthSelect.addEventListener("change", updateUI);

    updateUI();
});
