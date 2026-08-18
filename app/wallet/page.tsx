'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/app-shell';

type Tab = 'overview' | 'transactions' | 'transfer';

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  timestamp: Date;
  balance: number;
}

export default function WalletPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [balance, setBalance] = useState<number>(1000000);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [transferAmount, setTransferAmount] = useState('');
  const [transferRecipient, setTransferRecipient] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState(false);

  useEffect(() => {
    // Simulate loading wallet data
    const mockTransactions: Transaction[] = [
      {
        id: '1',
        type: 'credit',
        amount: 50000,
        description: 'Received from marketplace sale',
        timestamp: new Date(Date.now() - 86400000 * 2),
        balance: 1000000,
      },
      {
        id: '2',
        type: 'debit',
        amount: 10000,
        description: 'Marketplace purchase - "Designer Handbag"',
        timestamp: new Date(Date.now() - 86400000 * 5),
        balance: 950000,
      },
      {
        id: '3',
        type: 'credit',
        amount: 25000,
        description: 'Community donation from group',
        timestamp: new Date(Date.now() - 86400000 * 10),
        balance: 960000,
      },
      {
        id: '4',
        type: 'debit',
        amount: 5000,
        description: 'Transfer to @AminaEde',
        timestamp: new Date(Date.now() - 86400000 * 15),
        balance: 935000,
      },
    ];

    setTransactions(mockTransactions);
    setLoading(false);
  }, []);

  const handleTransfer = () => {
    setTransferError('');
    setTransferSuccess(false);

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

    // Simulate transfer
    const newBalance = balance - Number(transferAmount);
    setBalance(newBalance);

    const newTransaction: Transaction = {
      id: String(transactions.length + 1),
      type: 'debit',
      amount: Number(transferAmount),
      description: `Transfer to @${transferRecipient}`,
      timestamp: new Date(),
      balance: newBalance,
    };

    setTransactions([newTransaction, ...transactions]);
    setTransferAmount('');
    setTransferRecipient('');
    setTransferSuccess(true);

    setTimeout(() => setTransferSuccess(false), 5000);
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

  return (
    <AppShell title="Wallet" subtitle="Manage your Ituku Coins">
      <div className="wallet-container">
        {/* Balance Card */}
        <div className="balance-card">
          <div className="balance-content">
            <p className="balance-label">Available Balance</p>
            <div className="balance-amount">
              <span className="coin-icon">₿</span>
              <span className="amount">{formatCurrency(balance)}</span>
            </div>
            <p className="balance-currency">Ituku Coins</p>
          </div>
          <div className="balance-actions">
            <button className="action-button primary">
              <span>↓</span> Add Funds
            </button>
            <button className="action-button secondary">
              <span>→</span> Withdraw
            </button>
          </div>
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
        </div>

        {/* Tab Content */}
        <div className="wallet-content">
          {activeTab === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <p className="stat-label">Total Earned</p>
                  <p className="stat-value">₿ 250,000</p>
                  <p className="stat-change">+12% this month</p>
                </div>

                <div className="stat-card">
                  <p className="stat-label">Total Spent</p>
                  <p className="stat-value">₿ 125,000</p>
                  <p className="stat-change">-5% this month</p>
                </div>

                <div className="stat-card">
                  <p className="stat-label">Pending</p>
                  <p className="stat-value">₿ 0</p>
                  <p className="stat-change">No pending transactions</p>
                </div>

                <div className="stat-card">
                  <p className="stat-label">Marketplace</p>
                  <p className="stat-value">₿ 500,000</p>
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
                      {tx.type === 'credit' ? '+' : '-'}₿ {formatCurrency(tx.amount)}
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
                          {tx.type === 'credit' ? '+' : '-'}₿ {formatCurrency(tx.amount)}
                        </p>
                        <p className="balance">Balance: ₿ {formatCurrency(tx.balance)}</p>
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
                  ✓ Successfully transferred ₿ {formatCurrency(Number(transferAmount))} to @{transferRecipient}
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
                    <span className="currency-symbol">₿</span>
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
                  <p className="balance-hint">Available: ₿ {formatCurrency(balance)}</p>
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
      `}</style>
    </AppShell>
  );
}
