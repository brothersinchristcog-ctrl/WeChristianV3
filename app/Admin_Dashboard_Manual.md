---
pdf_options:
  format: A4
  margin: 20mm 20mm
  printBackground: true
---

<style>
  body {
    font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    color: #1a2d5a;
    line-height: 1.6;
  }
  h1 {
    color: #BE9A3A;
    border-bottom: 2px solid #BE9A3A;
    padding-bottom: 5px;
    font-size: 2.5em;
    text-align: center;
    margin-top: 50px;
  }
  h2 {
    color: #1a2d5a;
    border-bottom: 1px solid #e2e8f0;
    padding-bottom: 5px;
    margin-top: 30px;
    font-size: 1.8em;
  }
  h3 {
    color: #0284C7;
    margin-top: 20px;
  }
  .highlight {
    background-color: #fef3c7;
    padding: 5px;
    border-radius: 4px;
    color: #b45309;
    font-weight: bold;
  }
  .info-box {
    background-color: #f0f9ff;
    border-left: 4px solid #0284C7;
    padding: 15px;
    margin: 15px 0;
    border-radius: 0 5px 5px 0;
  }
  .warning-box {
    background-color: #fffbeb;
    border-left: 4px solid #f59e0b;
    padding: 15px;
    margin: 15px 0;
    border-radius: 0 5px 5px 0;
  }
  .success-box {
    background-color: #f0fdf4;
    border-left: 4px solid #22c55e;
    padding: 15px;
    margin: 15px 0;
    border-radius: 0 5px 5px 0;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  th, td {
    padding: 12px;
    border: 1px solid #cbd5e1;
    text-align: left;
  }
  th {
    background-color: #1a2d5a;
    color: white;
  }
  .cover-page {
    text-align: center;
    padding: 100px 0;
    page-break-after: always;
  }
  .cover-title {
    font-size: 3em;
    color: #1a2d5a;
    font-weight: bold;
    margin-bottom: 20px;
  }
  .cover-subtitle {
    font-size: 1.5em;
    color: #BE9A3A;
    margin-bottom: 50px;
  }
  .toc {
    page-break-after: always;
  }
</style>

<div class="cover-page">
  <div class="cover-title">WeChristian Admin Dashboard</div>
  <div class="cover-subtitle">Professional User Manual & Guide</div>
  <p><strong>For Pastors, Admins, and QA Testers</strong></p>
  <br/><br/>
  <p><em>Version 1.0</em></p>
</div>

<div class="toc">

## Table of Contents
1. [Introduction & Roles](#1-introduction--roles)
2. [Content Management](#2-content-management)
   - [Sermons](#sermons)
   - [Daily Promises](#daily-promises)
   - [Songs](#songs)
3. [Community & Engagement](#3-community--engagement)
   - [Prayer Wall](#prayer-wall)
   - [Events](#events)
   - [Attendance](#attendance)
   - [Members](#members)
4. [Celebrations & Communication](#4-celebrations--communication)
   - [Celebrations & WeCelebrations](#celebrations)
   - [Notifications & WhatsApp Inbox](#notifications)
5. [Finances](#5-finances)
   - [Expenses & Donations](#expenses)
6. [Administration & Settings](#6-administration--settings)
   - [Church Settings & Branches](#settings)
   - [About Us & Contact Us](#about)
7. [Online Meetings & Support](#7-online-meetings)

</div>

<div style="page-break-before: always;"></div>

## 1. Introduction & Roles

Welcome to the **WeChristian Admin Dashboard** manual. This guide is designed to empower church leaders with the tools needed to manage their digital congregation effectively.

<div class="info-box">
<strong>Role-Based Guidance:</strong>
<ul>
<li><strong>Pastors & Admins:</strong> Use this guide to understand workflows (e.g., how to schedule a sermon, track donations, or broadcast a meeting).</li>
<li><strong>Testers & QA:</strong> Look for the "Expected Results" and "Validation Checks" in each section to verify the app behaves as designed.</li>
</ul>
</div>

---

## 2. Content Management

<a name="sermons"></a>
### 📖 How to Create a Sermon
The Sermon module allows you to publish audio/video sermons to the app.

**Workflow:**
1. Navigate to **Sermons** > **+ New Sermon**.
2. **Sermon Info:** Enter the English/Telugu Title, Pastor Name, Date, Duration, and Scripture.
3. **Category:** Select tags like *Bible Study* or *Sunday Service*.
4. **Media:** Paste a YouTube URL (or upload an MP3 audio file up to 100MB). Upload a custom thumbnail (16:9).
5. **Publish Status:** Select *Draft*, *Schedule*, or *Publish now*.

<div class="success-box">
<strong>THE MAGIC STEP:</strong> If set to "Publish now" and the notification toggle is ON, the app automatically queues a Push Notification: <em>"🎧 New Sermon: [Title] by [Pastor] is now available."</em>
</div>

**🧪 Tester Validations:**
- Verify that providing a YouTube URL automatically fetches the video thumbnail if a custom one isn't uploaded.
- Ensure audio files > 100MB are rejected by the form validation.

<a name="daily-promises"></a>
### 🕊️ How to Create a Daily Promise
Promises are daily verses displayed prominently to users.

**Workflow:**
1. Navigate to **Promises** > **+ New Promise** (or select a date via the **Schedule Calendar**).
2. **Date & Theme:** Pick a Date and a Background Color Theme.
3. **Content:** Enter the English and Telugu verse texts and references. Add a Devotional Note (optional).
4. **Media:** Upload a 16:9 thumbnail and a YouTube link (optional).
5. **Publish:** Save as Draft or Publish.

**🧪 Tester Validations:**
- Check the **Schedule Calendar**: Missing days should be Red, Drafts Amber, Published Green.
- Publishing a promise for *today* should instantly push an alert to members.

<a name="songs"></a>
### 🎵 How to Manage Songs
Create a digital lyric book for your congregation.

**Workflow:**
1. Navigate to **Song Manager** > **+ New**.
2. **Details:** Enter English/Telugu Titles, Artist, and a YouTube Lyrical Video Link.
3. **Categories:** Tag the song (e.g., Stuthi, Aradhana).
4. **Lyrics:** Paste the full lyrics.
5. **Theme Songs:** Toggle the ⭐ icon to pin the song to the highlighted "Theme Songs" tab.

---

<div style="page-break-before: always;"></div>

## 3. Community & Engagement

<a name="prayer-wall"></a>
### 🙏 Managing the Prayer Wall
Review, moderate, and post prayer requests.

**Workflow:**
1. Navigate to **Prayers**. Review incoming member requests.
2. **Approve (✔):** Moves the prayer to the public wall.
3. **Delete (🗑):** Rejects and removes inappropriate requests.
4. **Create New:** Click "+ New", search for a member in the directory, enter the prayer details, and select a "Post As" identity (Admin, Corporate, or Anonymous).

**🧪 Tester Validations:**
- Verify that deleting a request completely removes it from Firestore.
- Check that "Anonymous" posts hide the member's profile picture and name in the feed.

<a name="events"></a>
### 📅 Managing Events & Pastor Itinerary
Manage public church events and the Pastor's private travel itinerary.

#### General Church Events
- **Creation:** Set Event Type, Date, Time, Venue, and Mode (In-person/Online).
- **RSVP:** Enable RSVP with an optional maximum cap.
- **Notifications:** Set automated reminders (1 day before, 1 hour before).

#### Pastor Events (Live Tracker)
- **Wizard:** Follow the 3-step wizard to enter the Venue, Village, and **Full Address**.
- **Smart Engine:** The system checks for double-bookings and calculates travel time via Google Maps.
- **Map:** Plotted events appear on a Live Map for tracking.

<div class="warning-box">
<strong>Important Note:</strong> For Pastor Events, the Full Address is CRITICAL. The Google Maps integration relies on this to calculate travel time warnings.
</div>

<a name="attendance"></a>
### 🙋‍♂️ Managing Attendance
Send digital roll calls.

**Workflow:**
1. Navigate to **Attendance** > **New Event**.
2. Define the Event Type, Date, and **Time Window** (Start/End time).
3. **Send Request:** Pushes an interactive notification to members: *"Are you attending [Event]?"*
4. **Live Dashboard:** Monitor Yes, No, and Pending responses in real-time.

<a name="members"></a>
### 👥 Managing Members
Maintain your church directory.

**Workflow:**
1. Navigate to **Members**. Use the search bar or filters (Active/Inactive, Village).
2. **Actions:** Tap a member to call/email, view "Last App Opened", or promote to Admin.
3. **Add Member:** Fill out Full Name, Phone, DOB, and Role.
4. **Bulk Invite:** Use "Add From Contacts" to sync your phonebook.

<div class="success-box">
<strong>THE MAGIC STEP:</strong> Adding a new member triggers an automatic Share Screen with a pre-written WhatsApp invite containing your Church Code!
</div>

---

<div style="page-break-before: always;"></div>

## 4. Celebrations & Communication

<a name="celebrations"></a>
### 🎈 Celebrations & WeCelebrations
Track Birthdays, Wedding Anniversaries, and Baptism Anniversaries.

**Manual Celebrations:**
1. Select a member from the Celebrations list.
2. Use the Card Builder to set the Greeting, Theme/Photo, and Bible Verse.
3. Send via WhatsApp (opens personal WhatsApp) or Push Notification.

**WeCelebrations (Automated WhatsApp API):**
- Toggle Automation **ON**.
- The system auto-sends wishes at 6:00 AM (Birthdays), 6:30 AM (Baptisms), and 7:00 AM (Weddings) using Meta API.
- All sent messages are logged in the WhatsApp Inbox.

<a name="notifications"></a>
### 📢 Notifications & WhatsApp Inbox

**Notifications Module:**
- **Emergency Broadcast:** Triggers a high-priority push alert (🚨) to all users.
- **Custom Broadcast:** Send standard announcements.

**WhatsApp Inbox:**
- **Inbox View:** An embedded WhatsApp interface. Search and view chats with members.
- **Chat Interface:** Reply to members directly from the Admin Dashboard. Replies use the official Church WhatsApp Business number.

---

## 5. Finances

<a name="expenses"></a>
### 💰 Managing Expenses & Donations

#### Expenses
- **Add Expense:** Break down costs line-by-line using Preset or Custom items. Set Date, Vendor, and Payment Method.
- **Receipts:** Upload a photo/PDF of the bill.
- **Invoices:** Select multiple expenses and click "Generate Invoice" to create a PDF and alert Approvers for review.

#### Donations
- **Record Donation:** Select a Category and use the "Everyone" Autocomplete to instantly find a donor from the directory.
- **Receipts:** Saving a donation auto-generates a PDF receipt that can be shared via WhatsApp.
- **Reports:** Generate category-specific PDF reports for accounting.

**🧪 Tester Validations:**
- Verify that searching a donor in the "Everyone" box correctly pulls their phone number.
- Ensure the PDF generation library properly triggers a download/share intent.

---

<div style="page-break-before: always;"></div>

## 6. Administration & Settings

<a name="settings"></a>
### ⚙️ Church Settings & Branches

**Church Settings Tabs:**
- **Info:** Configure Church Name, Tagline, Address, Social Links, and WhatsApp Automation toggle.
- **Brand:** Upload a 1:1 Logo, 16:9 Banner, and select Primary/Accent colors.
- **Giving:** Toggle donations, configure Razorpay (Key ID/Secret), UPI accounts, and Bank Details.
- **WhatsApp:** Configure custom Meta Graph API credentials (Access Token & Phone ID).

**Church Branches:**
- Create sub-branches. The system generates a unique Church Code.
- Provide a Branch Admin phone number to automatically text them their login credentials.
- **Impersonation:** Super Admins can click "View Dashboard" on a branch card to switch their entire app context to manage that branch.

<a name="about"></a>
### ℹ️ About Us & Contact Us
- **About Us:** Edit Church Name, Subtitle, Description, Mission, and Vision. Saves instantly update the member app.
- **Contact Us:** Manage the physical address, multiple Phone Numbers, Email Addresses, and Social URLs.

---

## 7. Online Meetings & Support

<a name="online-meetings"></a>
### 💻 Online Meetings
Schedule virtual services with Google Meet integration.

**Workflow:**
1. Navigate to **Online Meetings** > **+ Create Schedule**.
2. Enter Topic, Teacher, Date, and Time.
3. **Generate Meet:** Click the blue button to automatically generate a Google Meet link.
4. **Start Class:** Clicking "Start Class & Open Meet" sends a "🔴 Live Now" push alert to all members and starts a Live Attendance Tracker.

### 🎧 Support Team
Need help?
- Navigate to **Support Team**.
- Use the quick-action buttons to WhatsApp or Call WeChristian support engineers.
- Typical response time is within one business day for digital tickets.

---
*End of Document. Generated by WeChristian Admin Assistant.*
