document.addEventListener("DOMContentLoaded", () => {
    const balanceEl = document.getElementById("balance");
    const incomeEl = document.getElementById("income");
    const expensesEl = document.getElementById("expenses");
    const transactionForm = document.getElementById("transaction-form");
    const transactionList = document.getElementById("transaction-list");
    const categoryEl = document.getElementById("category");

    let transactions = JSON.parse(localStorage.getItem("transactions")) || [];

    function updateUI() {
        let income = 0, expenses = 0, balance = 0;
        transactionList.innerHTML = "";
        transactions.forEach(transaction => {
            const li = document.createElement("li");
            li.innerHTML = `${transaction.desc} - $${transaction.amount} 
                <button onclick="removeTransaction(${transaction.id})">X</button>`;
            transactionList.appendChild(li);

            if (transaction.amount > 0) {
                income += transaction.amount;
            } else {
                expenses += Math.abs(transaction.amount);
            }
        });

        balance = income - expenses;
        balanceEl.textContent = `$${balance.toFixed(2)}`;
        incomeEl.textContent = `$${income.toFixed(2)}`;
        expensesEl.textContent = `$${expenses.toFixed(2)}`;
        localStorage.setItem("transactions", JSON.stringify(transactions));
    }

    transactionForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const desc = document.getElementById("desc").value;
        const amount = parseFloat(document.getElementById("amount").value);

    }}}