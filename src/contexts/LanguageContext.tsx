import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ja';

interface Translations {
  [key: string]: {
    en: string;
    ja: string;
  };
}

const translations: Translations = {
  // Navigation
  'nav.dashboard': { en: 'Dashboard', ja: 'ダッシュボード' },
  'nav.tickets': { en: 'Tickets', ja: 'チケット' },
  'nav.newTicket': { en: 'New Ticket', ja: '新規チケット' },
  'nav.users': { en: 'Users', ja: 'ユーザー' },
  'nav.agents': { en: 'Agents', ja: 'エージェント' },
  'nav.teams': { en: 'Teams', ja: 'チーム' },
  'nav.categories': { en: 'Categories', ja: 'カテゴリー' },
  'nav.tags': { en: 'Tags', ja: 'タグ' },
  'nav.slaRules': { en: 'SLA Rules', ja: 'SLAルール' },
  'nav.automation': { en: 'Automation', ja: '自動化' },
  'nav.knowledgeBase': { en: 'Knowledge Base', ja: 'ナレッジベース' },
  'nav.reports': { en: 'Reports', ja: 'レポート' },
  'nav.auditLogs': { en: 'Audit Logs', ja: '監査ログ' },
  'nav.notifications': { en: 'Notifications', ja: '通知' },
  'nav.settings': { en: 'Settings', ja: '設定' },
  'nav.profile': { en: 'Profile', ja: 'プロフィール' },
  'nav.logout': { en: 'Logout', ja: 'ログアウト' },
  
  // Auth
  'auth.login': { en: 'Login', ja: 'ログイン' },
  'auth.register': { en: 'Register', ja: '新規登録' },
  'auth.forgotPassword': { en: 'Forgot Password', ja: 'パスワードを忘れた' },
  'auth.resetPassword': { en: 'Reset Password', ja: 'パスワードリセット' },
  'auth.email': { en: 'Email', ja: 'メールアドレス' },
  'auth.password': { en: 'Password', ja: 'パスワード' },
  'auth.confirmPassword': { en: 'Confirm Password', ja: 'パスワード確認' },
  'auth.name': { en: 'Name', ja: '名前' },
  'auth.role': { en: 'Role', ja: '役割' },
  'auth.signIn': { en: 'Sign In', ja: 'サインイン' },
  'auth.signUp': { en: 'Sign Up', ja: '新規登録' },
  'auth.noAccount': { en: "Don't have an account?", ja: 'アカウントをお持ちでない方' },
  'auth.hasAccount': { en: 'Already have an account?', ja: 'すでにアカウントをお持ちの方' },
  'auth.sendResetLink': { en: 'Send Reset Link', ja: 'リセットリンクを送信' },
  'auth.backToLogin': { en: 'Back to Login', ja: 'ログインに戻る' },
  
  // Tickets
  'ticket.title': { en: 'Title', ja: 'タイトル' },
  'ticket.description': { en: 'Description', ja: '説明' },
  'ticket.priority': { en: 'Priority', ja: '優先度' },
  'ticket.status': { en: 'Status', ja: 'ステータス' },
  'ticket.category': { en: 'Category', ja: 'カテゴリー' },
  'ticket.assignedTo': { en: 'Assigned To', ja: '担当者' },
  'ticket.createdBy': { en: 'Created By', ja: '作成者' },
  'ticket.createdAt': { en: 'Created At', ja: '作成日時' },
  'ticket.updatedAt': { en: 'Updated At', ja: '更新日時' },
  'ticket.slaResponseDue': { en: 'Response Due', ja: '応答期限' },
  'ticket.slaResolveDue': { en: 'Resolution Due', ja: '解決期限' },
  'ticket.addMessage': { en: 'Add Message', ja: 'メッセージを追加' },
  'ticket.internalNote': { en: 'Internal Note', ja: '内部メモ' },
  'ticket.sendReply': { en: 'Send Reply', ja: '返信を送信' },
  'ticket.createTicket': { en: 'Create Ticket', ja: 'チケットを作成' },
  
  // Priority
  'priority.low': { en: 'Low', ja: '低' },
  'priority.medium': { en: 'Medium', ja: '中' },
  'priority.high': { en: 'High', ja: '高' },
  'priority.urgent': { en: 'Urgent', ja: '緊急' },
  
  // Status
  'status.open': { en: 'Open', ja: 'オープン' },
  'status.assigned': { en: 'Assigned', ja: '割り当て済み' },
  'status.in_progress': { en: 'In Progress', ja: '対応中' },
  'status.waiting_on_user': { en: 'Waiting on User', ja: 'ユーザー待ち' },
  'status.on_hold': { en: 'On Hold', ja: '保留中' },
  'status.escalated': { en: 'Escalated', ja: 'エスカレーション' },
  'status.resolved': { en: 'Resolved', ja: '解決済み' },
  'status.closed': { en: 'Closed', ja: 'クローズ' },
  'status.reopened': { en: 'Reopened', ja: '再オープン' },
  'status.cancelled': { en: 'Cancelled', ja: 'キャンセル' },
  'status.duplicate': { en: 'Duplicate', ja: '重複' },
  
  // Common
  'common.search': { en: 'Search...', ja: '検索...' },
  'common.filter': { en: 'Filter', ja: 'フィルター' },
  'common.sort': { en: 'Sort', ja: '並び替え' },
  'common.actions': { en: 'Actions', ja: 'アクション' },
  'common.save': { en: 'Save', ja: '保存' },
  'common.cancel': { en: 'Cancel', ja: 'キャンセル' },
  'common.delete': { en: 'Delete', ja: '削除' },
  'common.edit': { en: 'Edit', ja: '編集' },
  'common.view': { en: 'View', ja: '表示' },
  'common.create': { en: 'Create', ja: '作成' },
  'common.update': { en: 'Update', ja: '更新' },
  'common.loading': { en: 'Loading...', ja: '読み込み中...' },
  'common.noData': { en: 'No data available', ja: 'データがありません' },
  'common.success': { en: 'Success', ja: '成功' },
  'common.error': { en: 'Error', ja: 'エラー' },
  
  // Dashboard
  'dashboard.welcome': { en: 'Welcome back', ja: 'おかえりなさい' },
  'dashboard.overview': { en: 'Overview', ja: '概要' },
  'dashboard.totalTickets': { en: 'Total Tickets', ja: '総チケット数' },
  'dashboard.openTickets': { en: 'Open Tickets', ja: 'オープンチケット' },
  'dashboard.resolvedToday': { en: 'Resolved Today', ja: '本日解決' },
  'dashboard.averageResponseTime': { en: 'Avg Response Time', ja: '平均応答時間' },
  'dashboard.recentTickets': { en: 'Recent Tickets', ja: '最近のチケット' },
  'dashboard.ticketsByPriority': { en: 'Tickets by Priority', ja: '優先度別チケット' },
  'dashboard.ticketsByStatus': { en: 'Tickets by Status', ja: 'ステータス別チケット' },
  
  // Roles
  'role.user': { en: 'User', ja: 'ユーザー' },
  'role.agent': { en: 'Agent', ja: 'エージェント' },
  'role.admin': { en: 'Admin', ja: '管理者' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};
