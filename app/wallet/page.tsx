'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/app-shell';
import { fetchUserDirectory, fetchWalletBalance, fetchWalletLedger, fetchWalletTransfers, getSession, requestWalletWithdrawal, sendWalletCoins } from '../lib/api';

type Tab = 'overview' | 'transactions' | 'transfer' | 'withdraw';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: Date;
  balance: number;
}

function CoinMark({ compact = false }: { compact?: boolean }) {
  return <span className={`coin-mark${compact ? ' compact' : ''}`} aria-label="Ituku Coin">₿</span>;
}

function CoinAmount({ amount, sign = '' }: { amount: number; sign?: string }) {
  return <span className="coin-amount"><CoinMark compact />{sign}{amount.toLocaleString('en-US')}</span>;
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);
  const [transferSummary, setTransferSummary] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);
  const [pageError, setPageError] = useState('');

  useEffect(() => {
    if (!getSession()?.token) {
      setPageError('Sign in to view your wallet and transactions.');
      setLoading(false);
      return;
    }

    Promise.all([fetchWalletBalance(), fetchWalletLedger(), fetchWalletTransfers()])
      .then(([wallet, ledger, transfers]) => {
        setBalance(wallet.balance);
        const transfersByReference = new Map(transfers.map((entry) => [entry.id, entry]));
        let runningBalance = wallet.balance;
        const ledgerItems = ledger.map((entry) => {
          const transfer = entry.referenceId ? transfersByReference.get(entry.referenceId) : undefined;
          const item = {
            id: entry.id,
            type: entry.amount >= 0 ? 'credit' as const : 'debit' as const,
            amount: Math.abs(entry.amount),
            description: transfer
              ? transfer.type === 'received'
                ? `Received from @${transfer.sender?.username || 'user'}`
                : `Transfer to @${transfer.receiver?.username || 'user'}`
              : entry.description,
            timestamp: new Date(entry.createdAt),
            balance: runningBalance,
          };
          runningBalance -= entry.amount;
          return item;
        });
        setTransactions(ledgerItems);
      })
      .catch((error) => setPageError(error instanceof Error ? error.message : 'Wallet data is unavailable.'))
      .finally(() => setLoading(false));
  }, []);

  const handleTransfer = async () => {
    setTransferError('');
    setTransferSuccess(false);
    setTransferSummary('');

    // Validation
    if (!transferRecipient.trim()) {
      setTransferError('Please enter recipient username');
      return;
    }
    if (!transferAmount || isNaN(Number(transferAmount))) {
      setTransferError('Please enter valid amount');
      return;
    }
    if (Number(transferAmount) <= 0) {
      setTransferError('Amount must be greater than 0');
      return;
    }
    if (Number(transferAmount) > balance) {
      setTransferError('Insufficient balance');
      return;
    }

    const recipientQuery = transferRecipient.trim().replace(/^@/, '');
    try {
      const recipients = await fetchUserDirectory(recipientQuery);
      const recipient = recipients.find((user) => user.username.toLowerCase() === recipientQuery.toLowerCase());
      if (!recipient) {
        setTransferError('Recipient username was not found.');
        return;
      }

      const result = await sendWalletCoins(recipient.id, Number(transferAmount));
      const sentAmount = Number(transferAmount);
      setBalance(result.senderBalance);
      setTransactions((current) => [{ id: `transfer-${Date.now()}`, type: 'debit', amount: sentAmount, description: `Transfer to @${recipient.username}`, timestamp: new Date(), balance: result.senderBalance }, ...current]);
      setTransferSuccess(true);
      setTransferSummary(`Sent ${formatCurrency(sentAmount)} Ituku Coins to @${recipient.username}.`);
    } catch (error) {
      setTransferError(error instanceof Error ? error.message : 'Transfer failed.');
      return;
    }
    setTransferAmount('');
    setTransferRecipient('');

    setTimeout(() => setTransferSuccess(false), 5000);
  };

  const handleWithdrawal = async () => {
    setWithdrawError('');
    setWithdrawSuccess(false);
    const amount = Number(withdrawAmount);
    if (!Number.isInteger(amount) || amount <= 0) {
      setWithdrawError('Enter a whole number of coins greater than 0.');
      return;
    }
    if (amount > balance) {
      setWithdrawError('Insufficient balance.');
      return;
    }
    if (!bankAccount.trim() || !accountHolderName.trim()) {
      setWithdrawError('Bank account and account holder name are required.');
      return;
    }
    try {
      const result = await requestWalletWithdrawal(amount, bankAccount.trim(), accountHolderName.trim());
      setBalance(result.remainingBalance);
      setWithdrawAmount('');
      setBankAccount('');
      setAccountHolderName('');
      setWithdrawSuccess(true);
    } catch (error) {
      setWithdrawError(error instanceof Error ? error.message : 'Withdrawal request failed.');
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-US');
  };

  const totalEarned = transactions.filter((transaction) => transaction.type === 'credit').reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalSpent = transactions.filter((transaction) => transaction.type === 'debit').reduce((sum, transaction) => sum + transaction.amount, 0);

  return (
    <AppShell title="Wallet" subtitle="Manage your Ituku Coins">
      <div className="wallet-container">
        {pageError && <div className="error-message">{pageError}</div>}
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-content">
            <div className="wallet-card-eyebrow"><span className="wallet-card-dot" /> ITUKU WALLET</div>
            <p className="balance-label">Available Balance</p>
            <div className="balance-amount">
              <CoinMark />
              <span className="amount">{formatCurrency(balance)}</span>
            </div>
            <p className="balance-currency">Ituku Coins</p>
          </div>
          <div className="balance-actions">
            <Link className="action-button primary" href="/coins">
              <span aria-hidden="true">↓</span> Add Funds
            </Link>
            <button className="action-button secondary" type="button" onClick={() => setActiveTab('withdraw')}>
              <span aria-hidden="true">→</span> Withdraw
            </button>
          </div>
        </div>

        <div className="wallet-section-heading">
          <div>
            <p className="section-kicker">YOUR MONEY, IN MOTION</p>
            <h2>Keep your Ituku circle moving.</h2>
          </div>
          <span className="secure-note"><span aria-hidden="true">●</span> Secure wallet</span>
        </div>

        {/* Tabs */}
        <div className="wallet-tabs">
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            Transactions
          </button>
          <button
            className={`tab ${activeTab === 'transfer' ? 'active' : ''}`}
            onClick={() => setActiveTab('transfer')}
          >
            Send Coins
          </button>
          <button
            className={`tab ${activeTab === 'withdraw' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdraw')}
          >
            Withdraw
          </button>
        </div>

        {/* Tab Content */}
        <div className="wallet-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <span className="stat-mark earned">↘</span>
                  <p className="stat-label">Total Earned</p>
                  <p className="stat-value"><CoinAmount amount={totalEarned} /></p>
                  <p className="stat-change">+12% this month</p>
                </div>

                <div className="stat-card">
                  <span className="stat-mark spent">↗</span>
                  <p className="stat-label">Total Spent</p>
                  <p className="stat-value"><CoinAmount amount={totalSpent} /></p>
                  <p className="stat-change">-5% this month</p>
                </div>

                <div className="stat-card">
                  <span className="stat-mark pending">◷</span>
                  <p className="stat-label">Pending</p>
                  <p className="stat-value"><CoinAmount amount={0} /></p>
                  <p className="stat-change">No pending transactions</p>
                </div>

                <div className="stat-card">
                  <span className="stat-mark market">◌</span>
                  <p className="stat-label">Marketplace</p>
                  <p className="stat-value"><CoinAmount amount={balance} /></p>
                  <p className="stat-change">Available for trading</p>
                </div>
              </div>

              <div className="recent-activity">
                <h3>Recent Activity</h3>
                {transactions.slice(0, 3).map((tx) => (
                  <div key={tx.id} className="activity-item">
                    <div className="activity-icon" data-type={tx.type}>
                      {tx.type === 'credit' ? '↓' : '↑'}
                    </div>
                    <div className="activity-content">
                      <p className="activity-description">{tx.description}</p>
                      <p className="activity-date">{formatDate(tx.timestamp)}</p>
                    </div>
                    <div className={`activity-amount ${tx.type}`}>
                      <CoinAmount amount={tx.amount} sign={tx.type === 'credit' ? '+' : '-'} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="transactions-section">
              <div className="transactions-header">
                <h3>Transaction History</h3>
                <select className="filter-select">
                  <option value="all">All Transactions</option>
                  <option value="credit">Received</option>
                  <option value="debit">Sent</option>
                  <option value="month">Last Month</option>
                </select>
              </div>

              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div className="spinner"></div>
                </div>
              ) : transactions.length > 0 ? (
                <div className="transactions-list">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="transaction-item">
                      <div className="transaction-icon" data-type={tx.type}>
                        {tx.type === 'credit' ? '↓' : '↑'}
                      </div>
                      <div className="transaction-details">
                        <p className="transaction-description">{tx.description}</p>
                        <p className="transaction-date">{formatDate(tx.timestamp)}</p>
                      </div>
                      <div className="transaction-amount">
                        <p className={`amount ${tx.type}`}>
                          <CoinAmount amount={tx.amount} sign={tx.type === 'credit' ? '+' : '-'} />
                        </p>
                        <p className="balance">Balance: <CoinAmount amount={tx.balance} /></p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#999' }}>
                  <p>No transactions yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'transfer' && (
            <div className="transfer-section">
              <h3>Send Coins to Another User</h3>

              {transferSuccess && (
                <div className="success-message">
                  ✓ {transferSummary || 'Transfer sent successfully.'}
                </div>
              )}

              {transferError && (
                <div className="error-message">
                  ✗ {transferError}
                </div>
              )}

              <div className="transfer-form">
                <div className="form-group">
                  <label htmlFor="recipient">Recipient Username</label>
                  <input
                    type="text"
                    id="recipient"
                    placeholder="@username"
                    value={transferRecipient}
                    onChange={(e) => setTransferRecipient(e.target.value)}
                    className={transferError && !transferRecipient ? 'error' : ''}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="amount">Amount (Ituku Coins)</label>
                  <div className="amount-input-group">
                    <CoinMark compact />
                    <input
                      type="number"
                      id="amount"
                      placeholder="0"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      min="1"
                      className={transferError && !transferAmount ? 'error' : ''}
                    />
                  </div>
                  <p className="balance-hint">Available: <CoinAmount amount={balance} /></p>
                </div>

                <button
                  className="send-button"
                  onClick={handleTransfer}
                  disabled={!transferRecipient || !transferAmount}
                >
                  Send Coins
                </button>
              </div>

              <div className="transfer-info">
                <h4>Transfer Information</h4>
                <ul>
                  <li>Transfers are instant and irreversible</li>
                  <li>No fees for peer-to-peer transfers</li>
                  <li>Both parties must have active accounts</li>
                  <li>Recipient will receive an in-app notification</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'withdraw' && (
            <div className="transfer-section">
              <h3>Withdraw Ituku Coins</h3>
              {withdrawSuccess && <div className="success-message">✓ Withdrawal request submitted for review.</div>}
              {withdrawError && <div className="error-message">✗ {withdrawError}</div>}
              <div className="transfer-form">
                <div className="form-group">
                  <label htmlFor="withdrawAmount">Amount (Ituku Coins)</label>
                  <div className="amount-input-group">
                    <CoinMark compact />
                    <input id="withdrawAmount" type="number" min="1" value={withdrawAmount} onChange={(event) => setWithdrawAmount(event.target.value)} placeholder="0" />
                  </div>
                  <p className="balance-hint">Available: <CoinAmount amount={balance} /></p>
                </div>
                <div className="form-group">
                  <label htmlFor="accountHolderName">Account holder name</label>
                  <input id="accountHolderName" value={accountHolderName} onChange={(event) => setAccountHolderName(event.target.value)} placeholder="Full name on account" />
                </div>
                <div className="form-group">
                  <label htmlFor="bankAccount">Bank account</label>
                  <input id="bankAccount" value={bankAccount} onChange={(event) => setBankAccount(event.target.value)} placeholder="Account number" inputMode="numeric" />
                </div>
                <button className="send-button" type="button" onClick={handleWithdrawal}>Request withdrawal</button>
              </div>
              <div className="transfer-info"><h4>Withdrawal status</h4><ul><li>Requests are deducted from your available balance.</li><li>An administrator reviews each request before completion.</li><li>Rejected requests are refunded by the backend.</li></ul></div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .wallet-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 20px;
        }

        .balance-card {
          background: linear-gradient(135deg, #1877f2 0%, #0a66c2 100%);
          border-radius: 12px;
          padding: 30px;
          color: white;
          margin-bottom: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 4px 12px rgba(24, 119, 242, 0.3);
        }

        .balance-content {
          flex: 1;
        }

        .balance-label {
          margin: 0;
          font-size: 14px;
          opacity: 0.9;
          font-weight: 500;
        }

        .balance-amount {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 12px 0;
        }

        .coin-icon {
          font-size: 32px;
          font-weight: bold;
        }

        .balance-amount .amount {
          font-size: 36px;
          font-weight: 700;
        }

        .balance-currency {
          margin: 0;
          font-size: 12px;
          opacity: 0.85;
        }

        .balance-actions {
          display: flex;
          gap: 12px;
        }

        .action-button {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .action-button.primary {
          background: rgba(255, 255, 255, 0.25);
          color: white;
        }

        .action-button.primary:hover {
          background: rgba(255, 255, 255, 0.35);
        }

        .action-button.secondary {
          background: white;
          color: #1877f2;
        }

        .action-button.secondary:hover {
          background: #f0f2f5;
        }

        .wallet-tabs {
          display: flex;
          gap: 12px;
          border-bottom: 2px solid #e0e0e0;
          margin-bottom: 24px;
        }

        .tab {
          background: none;
          border: none;
          padding: 12px 16px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          color: #666;
          border-bottom: 3px solid transparent;
          margin-bottom: -2px;
          transition: all 0.2s;
        }

        .tab:hover {
          color: #1877f2;
        }

        .tab.active {
          color: #1877f2;
          border-bottom-color: #1877f2;
        }

        .wallet-content {
          background: white;
          border-radius: 12px;
          padding: 24px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-card {
          background: #f5f5f5;
          padding: 16px;
          border-radius: 8px;
          border-left: 4px solid #1877f2;
        }

        .stat-label {
          margin: 0;
          font-size: 12px;
          color: #666;
          font-weight: 500;
          text-transform: uppercase;
        }

        .stat-value {
          margin: 8px 0 4px 0;
          font-size: 22px;
          font-weight: 700;
          color: #000;
        }

        .stat-change {
          margin: 0;
          font-size: 12px;
          color: #4caf50;
        }

        .recent-activity h3 {
          font-size: 16px;
          margin-top: 0;
          margin-bottom: 16px;
          color: #000;
        }

        .activity-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 0;
          border-bottom: 1px solid #f0f0f0;
        }

        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }

        .activity-icon[data-type='credit'] {
          background: #e8f5e9;
          color: #4caf50;
        }

        .activity-icon[data-type='debit'] {
          background: #ffebee;
          color: #e74c3c;
        }

        .activity-content {
          flex: 1;
        }

        .activity-description {
          margin: 0;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .activity-date {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #999;
        }

        .activity-amount {
          font-weight: 600;
          font-size: 14px;
        }

        .activity-amount.credit {
          color: #4caf50;
        }

        .activity-amount.debit {
          color: #e74c3c;
        }

        .transactions-section {
          width: 100%;
        }

        .transactions-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .transactions-header h3 {
          margin: 0;
          font-size: 16px;
          color: #000;
        }

        .filter-select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .spinner {
          width: 30px;
          height: 30px;
          border: 3px solid #f0f0f0;
          border-top-color: #1877f2;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .transactions-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .transaction-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9f9f9;
          border-radius: 8px;
          border-left: 4px solid transparent;
        }

        .transaction-item:hover {
          background: #f5f5f5;
        }

        .transaction-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          flex-shrink: 0;
        }

        .transaction-icon[data-type='credit'] {
          background: #e8f5e9;
          color: #4caf50;
        }

        .transaction-icon[data-type='debit'] {
          background: #ffebee;
          color: #e74c3c;
        }

        .transaction-details {
          flex: 1;
        }

        .transaction-description {
          margin: 0;
          font-size: 14px;
          color: #333;
          font-weight: 500;
        }

        .transaction-date {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #999;
        }

        .transaction-amount {
          text-align: right;
        }

        .transaction-amount .amount {
          margin: 0;
          font-weight: 600;
          font-size: 14px;
        }

        .transaction-amount .amount.credit {
          color: #4caf50;
        }

        .transaction-amount .amount.debit {
          color: #e74c3c;
        }

        .transaction-amount .balance {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: #999;
        }

        .transfer-section h3 {
          font-size: 18px;
          margin: 0 0 20px 0;
          color: #000;
        }

        .success-message {
          background: #e8f5e9;
          border: 1px solid #4caf50;
          color: #1b5e20;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .error-message {
          background: #ffebee;
          border: 1px solid #e74c3c;
          color: #b71c1c;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 16px;
          font-size: 14px;
        }

        .transfer-form {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 8px;
          color: #333;
        }

        .form-group input {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          box-sizing: border-box;
          transition: border-color 0.2s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #1877f2;
          box-shadow: 0 0 0 3px rgba(24, 119, 242, 0.1);
        }

        .form-group input.error {
          border-color: #e74c3c;
        }

        .amount-input-group {
          position: relative;
        }

        .currency-symbol {
          position: absolute;
          left: 10px;
          top: 50%;
          transform: translateY(-50%);
          font-weight: 600;
          color: #666;
        }

        .amount-input-group input {
          padding-left: 30px;
        }

        .balance-hint {
          margin: 6px 0 0 0;
          font-size: 12px;
          color: #999;
        }

        .send-button {
          width: 100%;
          padding: 12px;
          background: #1877f2;
          color: white;
          border: none;
          border-radius: 6px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: background 0.2s;
        }

        .send-button:hover:not(:disabled) {
          background: #0a66c2;
        }

        .send-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .transfer-info {
          background: #f0f7ff;
          border-left: 4px solid #1877f2;
          padding: 16px;
          border-radius: 6px;
        }

        .transfer-info h4 {
          margin: 0 0 12px 0;
          font-size: 14px;
          color: #1877f2;
        }

        .transfer-info ul {
          margin: 0;
          padding-left: 20px;
        }

        .transfer-info li {
          margin: 6px 0;
          font-size: 13px;
          color: #333;
        }

        @media (max-width: 600px) {
          .wallet-container {
            padding: 12px;
          }

          .balance-card {
            flex-direction: column;
            text-align: center;
            padding: 20px;
            gap: 16px;
          }

          .balance-actions {
            width: 100%;
            flex-direction: column;
          }

          .action-button {
            width: 100%;
            justify-content: center;
          }

          .wallet-tabs {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }

          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          }

          .transactions-header {
            flex-direction: column;
            gap: 12px;
            align-items: stretch;
          }

          .filter-select {
            width: 100%;
          }

          .balance-amount .amount {
            font-size: 28px;
          }

          .stat-value {
            font-size: 18px;
          }
        }

        .wallet-container { max-width: 1120px; padding: 30px 24px 56px; }
        .balance-card {
          position: relative;
          overflow: hidden;
          min-height: 230px;
          margin-bottom: 28px;
          padding: 32px 36px;
          border: 1px solid rgba(255,255,255,0.14);
          border-radius: 24px;
          background: linear-gradient(118deg, var(--coin-blue) 0%, #146fd2 62%, var(--coin-blue-deep) 100%);
          box-shadow: 0 20px 42px rgba(11,100,197,0.22);
        }
        .balance-card::after {
          position: absolute;
          right: -52px;
          bottom: -86px;
          width: 270px;
          height: 270px;
          border: 1px solid rgba(255,255,255,0.32);
          border-radius: 50%;
          box-shadow: 0 0 0 18px rgba(255,255,255,0.06), 0 0 0 38px rgba(255,255,255,0.04);
          content: "";
        }
        .balance-content, .balance-actions { position: relative; z-index: 1; }
        .wallet-card-eyebrow {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 34px;
          color: rgba(255,255,255,0.7);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
        }
        .wallet-card-dot { width: 7px; height: 7px; border-radius: 50%; background: #fff; box-shadow: 0 0 0 4px rgba(255,255,255,0.14); }
        .balance-label { color: rgba(255,255,255,0.72); font-size: 13px; }
        .balance-amount { gap: 12px; margin: 8px 0 6px; }
        .coin-mark {
          display: grid;
          width: 42px;
          height: 42px;
          place-items: center;
          border: 2px solid #fff;
          border-radius: 50%;
          color: #fff;
          font-family: Georgia, serif;
          font-size: 25px;
          font-weight: 700;
          line-height: 1;
          flex: 0 0 auto;
        }
        .coin-mark.compact {
          width: 1.25em;
          height: 1.25em;
          border-width: 1.5px;
          font-size: 0.75em;
          color: currentColor;
        }
        .coin-amount {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          white-space: nowrap;
        }
        .stat-value .coin-amount {
          gap: 7px;
        }
        .balance-amount .coin-mark {
          color: #fff;
        }
        .balance-amount .amount { font-size: clamp(38px, 5vw, 56px); letter-spacing: -0.04em; }
        .balance-currency { color: rgba(255,255,255,0.65); font-size: 13px; }
        .balance-actions { align-self: flex-end; }
        .action-button { min-height: 46px; border: 1px solid rgba(255,255,255,0.3); border-radius: 12px; padding: 11px 18px; font-size: 13px; font-weight: 700; box-shadow: 0 8px 18px rgba(0,0,0,0.08); }
        .action-button span[aria-hidden="true"] { display: inline-grid; width: 24px; height: 24px; place-items: center; border: 1px solid currentColor; border-radius: 50%; font-size: 16px; line-height: 1; }
        .action-button.primary { background: rgba(255,255,255,0.24); color: #fff; }
        .action-button.primary:hover { background: rgba(255,255,255,0.34); }
        .action-button.secondary { background: rgba(255,255,255,0.1); color: #fff; }
        .action-button.secondary:hover { background: rgba(255,255,255,0.18); }
        .wallet-section-heading { display: flex; align-items: end; justify-content: space-between; gap: 20px; margin: 0 0 18px; }
        .section-kicker { margin: 0 0 5px; color: var(--green); font-size: 11px; font-weight: 800; letter-spacing: 0.15em; }
        .wallet-section-heading h2 { margin: 0; color: #17251b; font-family: "Playfair Display", Georgia, serif; font-size: clamp(22px, 3vw, 30px); }
        .secure-note { color: var(--muted); font-size: 12px; white-space: nowrap; }
        .secure-note span { color: var(--green); font-size: 9px; }
        .wallet-tabs { gap: 4px; margin-bottom: 18px; padding: 4px; border: 1px solid var(--line); border-radius: 14px; background: #eef5ed; }
        .tab { margin: 0; border: 0; border-radius: 10px; padding: 11px 18px; color: var(--muted); font-size: 13px; }
        .tab:hover { color: var(--green); }
        .tab.active { background: #fff; color: var(--green); box-shadow: 0 3px 10px rgba(17,54,33,0.08); }
        .wallet-content { padding: 0; background: transparent; }
        .currency-symbol { display: grid; place-items: center; }
        .stats-grid { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin-bottom: 18px; }
        .stat-card { position: relative; min-height: 142px; padding: 18px; overflow: hidden; border: 1px solid var(--line); border-left: 0; border-radius: 16px; background: #fff; box-shadow: 0 8px 22px rgba(17,54,33,0.04); }
        .stat-mark { position: absolute; top: 14px; right: 16px; display: grid; width: 28px; height: 28px; place-items: center; border-radius: 9px; font-size: 16px; font-weight: 700; }
        .stat-mark.earned { background: #e4f3e5; color: var(--green); }
        .stat-mark.spent { background: #fff0dc; color: #b66b16; }
        .stat-mark.pending { background: #edf0ea; color: #6a766d; }
        .stat-mark.market { background: #f9edc7; color: #a87600; }
        .stat-label { color: var(--muted); font-size: 11px; letter-spacing: 0.08em; }
        .stat-value { margin: 18px 0 6px; color: #17251b; font-size: 19px; }
        .stat-change { color: var(--green); font-size: 11px; }
        .recent-activity, .transactions-section, .transfer-section { padding: 24px; border: 1px solid var(--line); border-radius: 18px; background: #fff; box-shadow: 0 8px 22px rgba(17,54,33,0.04); }
        .recent-activity h3, .transactions-header h3, .transfer-section h3 { color: #17251b; font-size: 17px; }
        .activity-item, .transaction-item { border-color: #edf2eb; }
        .activity-icon, .transaction-icon { border-radius: 12px; }
        .activity-icon[data-type='credit'], .transaction-icon[data-type='credit'] { background: #e4f3e5; color: var(--green); }
        .activity-icon[data-type='debit'], .transaction-icon[data-type='debit'] { background: #fff0dc; color: #b66b16; }
        .transaction-item, .transfer-form { background: #f7faf6; }
        .send-button { border-radius: 999px; background: var(--coin-blue); }
        .send-button:hover:not(:disabled) { background: var(--coin-blue-deep); }
        .transfer-info { border-left-color: var(--gold); background: #fff9e9; }
        .transfer-info h4 { color: #8d6710; }
        @media (min-width: 760px) {
          .overview-section { display: grid; grid-template-columns: minmax(0,1.25fr) minmax(280px,0.75fr); gap: 18px; }
          .overview-section .stats-grid { grid-column: 1 / -1; }
        }
        @media (max-width: 760px) {
          .wallet-container { padding: 20px 14px 40px; }
          .balance-card { align-items: flex-start; padding: 24px; }
          .balance-actions { align-self: stretch; }
          .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .wallet-section-heading { align-items: flex-start; flex-direction: column; gap: 8px; }
          .recent-activity, .transactions-section, .transfer-section { padding: 18px; }
        }
      `}</style>
    </AppShell>
  );
}
