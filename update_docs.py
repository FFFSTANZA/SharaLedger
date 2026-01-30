import os
import re

sidebar_content = """    <nav class="sidebar">
        <a href="index.html" class="logo">Versoll Books</a>
        
        <div class="search-container">
            <input type="text" id="doc-search" class="search-input" placeholder="Search documentation...">
        </div>

        <div class="nav-section">
            <h3>Getting Started</h3>
            <ul class="nav-links">
                <li><a href="index.html">Fundamentals & Orientation</a></li>
                <li><a href="first-time-setup.html">First-Time Setup</a></li>
                <li><a href="dashboard-overview.html">Dashboard Overview</a></li>
                <li><a href="chart-of-accounts.html">Chart of Accounts</a></li>
            </ul>
        </div>

        <div class="nav-section">
            <h3>Sales & POS</h3>
            <ul class="nav-links">
                <li><a href="sales-invoices.html">Invoicing Mastery</a></li>
                <li><a href="pos-billing.html">Point of Sale (POS)</a></li>
                <li><a href="loyalty-programs.html">Loyalty & Rewards</a></li>
                <li><a href="payments.html">Payments & Credit</a></li>
            </ul>
        </div>

        <div class="nav-section">
            <h3>Inventory</h3>
            <ul class="nav-links">
                <li><a href="items-inventory.html">Items & Services</a></li>
            </ul>
        </div>

        <div class="nav-section">
            <h3>Purchases</h3>
            <ul class="nav-links">
                <li><a href="purchase-invoices.html">Bills & Expenses</a></li>
                <li><a href="suppliers.html">Supplier Directory</a></li>
            </ul>
        </div>

        <div class="nav-section">
            <h3>Banking</h3>
            <ul class="nav-links">
                <li><a href="banking.html">Statements & Sync</a></li>
                <li><a href="reconciliation.html">Reconciliation</a></li>
            </ul>
        </div>

        <div class="nav-section">
            <h3>Compliance</h3>
            <ul class="nav-links">
                <li><a href="gst-compliance.html">GST Management</a></li>
                <li><a href="tds-handling.html">TDS Simplified</a></li>
                <li><a href="eway-bills.html">E-Way Bills</a></li>
            </ul>
        </div>
    </nav>"""

docs_dir = "/home/engine/project/docs"
html_files = [f for f in os.listdir(docs_dir) if f.endswith(".html")]

for filename in html_files:
    filepath = os.path.join(docs_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the sidebar
    new_content = re.sub(r'<nav class="sidebar">.*?</nav>', sidebar_content, content, flags=re.DOTALL)
    
    # Set the active link
    active_pattern = f'<li><a href="{filename}">(.+?)</a></li>'
    if filename in new_content:
        new_content = new_content.replace(f'<li><a href="{filename}">', f'<li><a href="{filename}" class="active">')
    
    # Remove any stray emojis just in case
    # This is a broad range of emojis
    new_content = re.sub(r'[\u2600-\u27BF]|[\uD83C-\uD83E][\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF]', '', new_content)

    # Remove badges like Phase 3 etc to make it even more minimal if present as emojis
    # (Already handled by the regex above mostly)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print(f"Updated {len(html_files)} files.")
