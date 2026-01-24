# Launch Readiness Checklist - Project Versoll

This document outlines the pending items and necessary actions before the official launch of the software.

## 1. Compliance & Legal
- [ ] **Terms of Service & Privacy Policy**: Draft and review legal documents, ensuring compliance with Indian Data Protection laws.
- [ ] **GST Compliance**: Ensure all tax calculations (IGST, CGST, SGST) are 100% accurate for all edge cases (Union Territories, Exempted goods, etc.).
- [ ] **Data Residency**: Ensure servers are located in India if required by financial regulations.

## 2. Advanced Integrations (Moving beyond Demo/Manual)
- [ ] **GSP Integration**: Partner with a GST Suvidha Provider (GSP) to enable direct filing of GSTR-1, GSTR-3B, and generation of E-Way Bills from within the app.
- [ ] **E-Invoicing (IRP)**: Implement direct integration with Invoice Registration Portals for businesses with turnover > ₹5Cr.
- [ ] **Banking APIs**: Move from CSV-only imports to direct API integrations with major banks (ICICI, HDFC, Axis, SBI) for real-time transaction sync.
- [ ] **Payment Gateways**: Integrate Razorpay, CCAvenue, or Cashfree to allow customers to pay invoices directly via UPI, Cards, or Netbanking.

## 3. Product Features (Core)
- [ ] **Multi-user RBAC**: Implement robust Role-Based Access Control (Admin, Accountant, Viewer, Data Entry).
- [ ] **Audit Logs**: Track every change made to financial documents for compliance and security.
- [ ] **Bulk Actions**: Enable bulk import/export for all major documents (Invoices, Parties, Items).
- [ ] **Mobile App**: Develop a Flutter or React Native companion app for receipt scanning and basic financial monitoring.

## 4. Technical & Infrastructure
- [ ] **Production Database**: Migrate from SQLite to a managed PostgreSQL instance (e.g., AWS RDS or DigitalOcean Managed DB).
- [ ] **Scalability**: Implement horizontal scaling and load balancing.
- [ ] **Backup & Recovery**: Automated daily backups with point-in-time recovery and off-site storage.
- [ ] **Performance Optimization**: Ensure reports (like General Ledger) remain fast even with 100k+ transactions.

## 5. Security & QA
- [ ] **Vulnerability Assessment**: Conduct a thorough security audit and penetration testing.
- [ ] **Stress Testing**: Simulate high load to identify bottlenecks.
- [ ] **Automated Testing**: Increase test coverage to at least 80% for core accounting logic.

## 6. Support & Documentation
- [ ] **User Manual**: Create comprehensive guides and video tutorials for all modules.
- [ ] **Onboarding Flow**: Improve the initial setup experience for new companies.
- [ ] **Support System**: Setup helpdesk (e.g., Zendesk or Intercom) for customer queries.

---

## Action Plan (Next 3 Months)

### Month 1: Core & Security
- Implement RBAC and Audit Logs.
- Complete the PostgreSQL migration.
- Conduct security audit.

### Month 2: Integrations
- Finalize GSP partnership.
- Implement E-Invoicing and E-Way Bill API integration.
- Start Banking API pilot with one bank (e.g., ICICI).

### Month 3: Launch Prep
- Finalize legal documents.
- Complete user documentation.
- Soft launch with selected beta users.
