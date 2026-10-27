# Architecture & Data Models: UPI Daily Budget & Nightly Roast

This document outlines the entity relationships and data flow across MongoDB Atlas models.

---

## 1. Entity-Relationship (ER) Model

```mermaid
erDiagram
    User ||--o{ DailyBudget : "has one per day"
    User ||--o{ Transaction : "performs"
    DailyBudget ||--o{ Transaction : "summarizes"

    User {
        ObjectId _id PK
        string name "trimmed"
        string email "unique, regex validated"
        string upiId "unique, lowercase"
        number defaultDailyCap "min: 100, default: 3300"
        string timezone "default: Asia/Kolkata"
        date createdAt
        date updatedAt
    }

    DailyBudget {
        ObjectId _id PK
        ObjectId userId FK "refers to User._id"
        string date "format: YYYY-MM-DD"
        number dailyCap "min: 0"
        number totalSpent "min: 0, default: 0"
        number remainingBalance "computed"
        string status "enum: GREEN, YELLOW, RED"
        string nightlyRoast "AI roast message"
        date createdAt
        date updatedAt
    }

    Transaction {
        ObjectId _id PK
        ObjectId userId FK "refers to User._id"
        string date "format: YYYY-MM-DD"
        number amount "min: 1"
        string merchant "name of vendor"
        string category "enum: FOOD, TRAVEL, etc."
        string simulatedUpiRef "unique UPI trace code"
        string note "optional"
        date createdAt
        date updatedAt
    }
```

---

## 2. Daily Spend & Deduction Lifecycle

```mermaid
flowchart TD
    A["👤 User triggers UPI Simulator (e.g. ₹250 at Zepto)"] --> B["1. Transaction.create(...)<br/>Saves expense record in Transaction collection"]
    B --> C["2. DailyBudget.findOneAndUpdate(...)<br/>Deducts ₹250 from remainingBalance<br/>Adds ₹250 to totalSpent"]
    C --> D{"remainingBalance <= 0?"}
    D -- Yes --> E["Update status = 'RED' 🚨"]
    D -- Near 0 (< 20%) --> F["Update status = 'YELLOW' ⚠️"]
    D -- Safe --> G["Keep status = 'GREEN' 🟢"]
    E & F & G --> H["10:30 PM Cron: AI reads DailyBudget & writes nightlyRoast text"]
```
