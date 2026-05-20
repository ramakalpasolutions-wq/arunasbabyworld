// src/app/admin/login/layout.js
// ✅ Empty pass-through — parent layout handles login page specially

export const metadata = {
  title: 'Admin Login | BabyBliss',
};

export default function AdminLoginLayout({ children }) {
  return <>{children}</>;
}