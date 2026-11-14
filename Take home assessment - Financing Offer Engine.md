# Take-Home Assessment: Financing Offer Engine

**Time expectation:** \~2 hours  
**Format:** Take-home, greenfield  
**Stack:** Your choice  
**AI usage:** Allowed (see note below)

---

## Overview

You will build a **small web application** consisting of:

1. A **backend service** that evaluates financing offers based on lender rules defined in a JSON file.  
2. A **frontend UI** that allows a user to input a few fields and explore the resulting offers.

This exercise is intentionally scoped to be simple and self-contained. There is **no database**, **no authentication**, and only **one backend endpoint**.

We are primarily evaluating:

* Code clarity and structure  
* Correctness and edge-case handling  
* API and UI design judgment  
* Ability to explain your decisions

---

## Functional Requirements

### Backend (Required)

#### Endpoint

`POST /quote`

#### 

#### Request Body

| {  "amount": 12000,  "creditBand": "B",  "state": "TX",  "procedure": "general"} |
| :---- |

* **amount** — number (USD)  
* **creditBand** — one of: `"A" | "B" | "C" | "D"`  
* **state** — 2-letter state code  
* **procedure** — string (e.g. `"general"`, `"implants"`, `"ortho"`)

#### Response Body

| {  "offers": \[    {      "lender": "Alpha",      "approved": true,      "apr": 11.9,      "termMonths": 36,      "monthlyPayment": 398.12,      "reasonCodes": \["OK\_CREDIT", "OK\_AMOUNT"\]    },    {      "lender": "Bravo",      "approved": false,      "reasonCodes": \["DECLINE\_PROCEDURE"\]    }  \]} |
| :---- |

---

## Lender Rules

You will be given a `lenders.json` file that defines:

* Lender metadata  
* APR by credit band  
* Fixed loan term  
* A small set of eligibility rules

See below for the full `lenders.json`

### Supported Rule Types

You only need to support the following rule types:

* `maxAmount`  
* `allowedCreditBands`  
* `allowedStates`  
* `disallowedProcedures`

If a rule fails, the lender should be marked as `approved: false` and return the associated `reasonCode`.

---

## Offer Calculation

* **If approved:**  
  * Select APR based on `creditBand`  
  * Use the lender’s fixed `termMonths`  
  * Compute a **monthly payment**  
    * You may use a simple amortization formula or a reasonable approximation  
    * Document your approach in the README


* **If declined:**  
  * Do **not** return APR, term, or payment  
  * Return one or more `reasonCodes`

---

## Validation & Errors

* Handle missing or invalid inputs gracefully  
* Return reasonable HTTP status codes  
* You may assume well-formed JSON, but not valid business values

---

## Frontend (Required)

Build a small UI that:

* Collects inputs:  
  * amount  
  * credit band  
  * state  
  * procedure  
* Calls `POST /quote`  
* Displays the resulting offers clearly

### UI Expectations

* Basic loading and error states  
* Clear distinction between approved and declined offers  
* Reason codes should be visible or explainable in the UI

### Creative Freedom

Beyond the basics, feel free to add **1–2 enhancements**, such as:

* Sorting offers (APR vs monthly payment)  
* Lender comparison cards  
* Decline-reason tooltips or expandable sections  
* Preset scenarios  
* Polished visual styling

---

## Constraints

* Any language / framework is allowed  
* Backend and frontend must be separate services (even if in one repo)  
* No database  
* No authentication  
* One backend endpoint only (`POST /quote`)  
* Rules must be read from the provided JSON file  
* Keep the scope tight — this is not a production system

---

## AI Usage

You **may** use AI tools while working on this assignment.

That said:

* We will evaluate the **final code**, not how it was written  
* In a future live session, you will be asked to:  
  * Walk through your solution  
  * Explain design decisions and tradeoffs  
  * Make small modifications or answer questions about the code

Design and structure matter more than volume or cleverness.

---

## Submission

Please include:

* A GitHub repo or zip file  
* A `README.md` with:  
  * How to run the app  
  * Any assumptions or shortcuts you took  
  * What you would improve with more time

Optional but appreciated:

* A few unit tests **or**  
* A short manual test plan

---

## Time Expectation Reminder

This should take **around 2 hours**. We do not expect polish everywhere — we are looking for strong fundamentals, clarity, and judgment.

## Full `lenders.json`:

| { "lenders": \[   {     "name": "Alpha",     "aprByCreditBand": {       "A": 7.9,       "B": 11.9,       "C": 17.9     },     "termMonths": 36,     "rules": \[       {         "type": "maxAmount",         "value": 25000,         "reasonCode": "DECLINE\_AMOUNT"       },       {         "type": "allowedCreditBands",         "value": \["A", "B", "C"\],         "reasonCode": "DECLINE\_CREDIT"       }     \],     "successReasonCodes": \["OK\_AMOUNT", "OK\_CREDIT"\]   },   {     "name": "Bravo",     "aprByCreditBand": {       "A": 9.9,       "B": 14.9,       "C": 19.9     },     "termMonths": 24,     "rules": \[       {         "type": "maxAmount",         "value": 15000,         "reasonCode": "DECLINE\_AMOUNT"       },       {         "type": "disallowedProcedures",         "value": \["implants"\],         "reasonCode": "DECLINE\_PROCEDURE"       },       {         "type": "allowedStates",         "value": \["TX", "FL"\],         "reasonCode": "DECLINE\_STATE"       }     \],     "successReasonCodes": \["OK\_AMOUNT", "OK\_PROCEDURE", "OK\_STATE"\]   },   {     "name": "Charlie",     "aprByCreditBand": {       "A": 8.9,       "B": 12.9,       "C": 18.9     },     "termMonths": 48,     "rules": \[       {         "type": "maxAmount",         "value": 30000,         "reasonCode": "DECLINE\_AMOUNT"       },       {         "type": "allowedCreditBands",         "value": \["A", "B", "C"\],         "reasonCode": "DECLINE\_CREDIT"       },       {         "type": "allowedStates",         "value": \["TX", "CA", "NY", "FL"\],         "reasonCode": "DECLINE\_STATE"       }     \],     "successReasonCodes": \["OK\_AMOUNT", "OK\_CREDIT", "OK\_STATE"\]   } \]} |
| :---- |

