# Member View Documentation

This document serves as a complete and exhaustive product/functional specification for the **Member View** of the application. It provides a pin-to-pin explanation of each screen, field, option, button, section, functionality, navigation, and user action to serve as a comprehensive reference for developers.

---

## 1. Home Screen

### What the Screen Is
The Home Screen is the primary landing page for members after successfully logging into the application. It acts as a central hub, aggregating the most important and recent information from various modules of the app.

### Purpose of the Screen
To provide members with a quick overview of daily content (like the Daily Promise and Daily Video), upcoming events, recent sermons, live celebrations, and quick navigation to all primary features of the app.

### Every Section, Field, Button, and Icon

#### 1. Header Section
*   **Icon (App Logo/Church Logo)**: Displayed at the top left.
*   **Greeting Text (Field)**: "Good Morning/Afternoon/Evening, [User First Name]".
*   **Notification Icon (Button/Icon)**: A bell icon at the top right.
    *   **Badge (Icon)**: A red dot or number on the bell indicating unread notifications.
    *   **Action**: Tapping navigates to the Notifications Screen.
*   **Profile Avatar (Icon/Button)**: Top right, next to notifications.
    *   **Action**: Tapping opens a quick profile menu or navigates directly to the Profile Screen.

#### 2. Daily Promise Card (Section)
*   **Title (Field)**: "Promise of the Day".
*   **Bible Verse Text (Field)**: The actual promise text (e.g., "For I know the plans I have for you...").
*   **Verse Reference (Field)**: e.g., "Jeremiah 29:11".
*   **Background Image/Color (Field)**: Dynamic background associated with the promise.
*   **Share Button (Icon/Button)**:
    *   **Action**: Opens native share dialog to share the promise text and reference via other apps (WhatsApp, SMS, etc.).
*   **Save/Bookmark Button (Icon/Button)**:
    *   **Action**: Saves the promise to the user's personal archive. Toggles between outlined (unsaved) and filled (saved) states.
*   **Card Action**: Tapping the card itself navigates to the detailed Promise Screen.

#### 3. Quick Actions / Navigation Menu (Section)
A horizontally scrollable row or a grid of icons for quick access.
*   **Give Button (Icon + Text)**: Navigates to the Giving/Donation screen.
*   **Bible Button (Icon + Text)**: Navigates to the Bible Reader screen.
*   **Events Button (Icon + Text)**: Navigates to the Events Calendar screen.
*   **Notes Button (Icon + Text)**: Navigates to Member Notes screen.
*   **Updates Button (Icon + Text)**: Navigates to Church Updates/News screen.

#### 4. Live Celebration / Broadcast Banner (Conditional Section)
*   **Visibility**: Only visible when a live stream is currently active.
*   **"LIVE" Badge (Icon/Text)**: Pulsing red indicator.
*   **Service Title (Field)**: e.g., "Sunday Morning Worship".
*   **Join Now Button (Button)**:
    *   **Action**: Navigates to the Live Celebrations/Video Player screen.

#### 5. Recent Sermons (Section)
*   **Section Title (Field)**: "Latest Sermons".
*   **View All Link (Button/Text)**:
    *   **Action**: Navigates to the main Sermon Screen.
*   **Horizontal Scroll List (Cards)**:
    *   **Sermon Thumbnail (Image)**: Preview image of the video.
    *   **Play Icon (Icon)**: Overlay on the thumbnail.
    *   **Sermon Title (Field)**: e.g., "Walking in Faith".
    *   **Preacher Name (Field)**: e.g., "Pastor John Doe".
    *   **Date (Field)**: e.g., "Oct 24, 2026".
    *   **Card Action**: Tapping a card navigates to the Sermon Video Player for that specific sermon.

#### 6. Upcoming Events (Section)
*   **Section Title (Field)**: "Upcoming Events".
*   **Vertical List of Event Cards**:
    *   **Date Box (Field)**: Month (Oct) and Day (25).
    *   **Event Title (Field)**: e.g., "Youth Ministry Meeting".
    *   **Time (Field)**: e.g., "6:00 PM - 8:00 PM".
    *   **Location (Field)**: e.g., "Main Hall".
    *   **Card Action**: Tapping navigates to Event Details Screen.

#### 7. Bottom Navigation Bar (Section)
*   **Home Icon (Active)**: Current screen.
*   **Sermons Icon**: Navigates to Sermon Screen.
*   **Prayer Icon**: Navigates to Prayer Screen.
*   **Profile Icon**: Navigates to Profile Screen.

### Data Displayed & Where Data Comes From
*   **User Name/Avatar**: Sourced from the local authenticated user session / Firebase Auth & Firestore `users` collection.
*   **Daily Promise**: Sourced from a `promises` collection (filtered by today's date) or an external API.
*   **Live Stream Status**: Sourced from a real-time database listener (Firestore `live_events` collection) indicating active status.
*   **Recent Sermons**: Sourced from the `sermons` collection (sorted by date descending, limit 3-5).
*   **Upcoming Events**: Sourced from the `events` collection (filtered by date >= today, limit 3).

### User Actions & Navigation Flow
1.  **Scroll**: Vertical scroll to view all sections. Horizontal scroll for Sermons and Quick Actions.
2.  **Tap Promise**: Go to Promise Screen.
3.  **Tap Live Banner**: Go to Live Stream Screen.
4.  **Tap Sermon**: Go to Sermon Detail Screen.
5.  **Tap Event**: Go to Event Detail Screen.
6.  **Tap Bottom Nav**: Switch to primary tabs.

### States
*   **Empty States**:
    *   *No Live Event*: The Live section is entirely hidden.
    *   *No Events*: Display a placeholder text "No upcoming events scheduled." instead of the list.
    *   *No Sermons*: Display placeholder text "Sermons will appear here soon."
*   **Loading States**:
    *   Skeleton loaders for the Promise Card, Sermon Cards, and Event Cards while fetching from Firestore.
*   **Error States**:
    *   If Firestore read fails, display a generic error card with a "Tap to Retry" button in place of the affected section.
*   **Success States**:
    *   When the promise is successfully saved, show a quick snackbar/toast: "Promise saved to archive."

### Permissions & Notifications
*   **Permissions**: Push notification permission prompt on first load if not already granted.
*   **Notifications**: Real-time push notifications can update the badge count on the bell icon.

### Edge Cases
*   **Network Disconnection**: Data fetched from cache if available. If no cache, show "No internet connection" banner at the top.
*   **Long Names/Titles**: Text fields (Sermon titles, event names) must truncate with ellipsis (`...`) to prevent UI breaking (max 2 lines).

---

## 2. Promise Screen

### What the Screen Is
A dedicated screen displaying the Daily Promise in full detail, along with a historical archive of past promises.

### Purpose of the Screen
To allow members to reflect on the daily scripture, share it, save it, and look back at previous promises for encouragement.

### Every Section, Field, Button, and Icon

#### 1. App Bar (Header)
*   **Back Button (Icon)**: Navigates back to the Home Screen.
*   **Screen Title (Field)**: "Daily Promise".
*   **Archive Icon (Icon/Button)**: Top right (e.g., a calendar or folder icon).
    *   **Action**: Navigates to the Promise Archive sub-screen.

#### 2. Main Promise Display (Section)
*   **Large Background Image (Image)**: High-resolution inspirational background.
*   **Date Display (Field)**: e.g., "Monday, October 24, 2026".
*   **Verse Text (Field)**: Large typography for the promise verse.
*   **Verse Reference (Field)**: e.g., "Psalms 23:1".

#### 3. Action Buttons (Section)
*   **Share Button (Button + Icon)**:
    *   **Action**: Opens native sharing to send text/image payload.
*   **Save/Favorite Button (Button + Icon)**:
    *   **Action**: Adds/removes the promise to the user's personal `saved_promises` collection.
*   **Copy Text Button (Button + Icon)**:
    *   **Action**: Copies the verse and reference to the device clipboard.

#### 4. Devotional/Reflection Text (Optional Section)
*   **Title (Field)**: "Reflection".
*   **Body Text (Field)**: A short paragraph explaining the verse.

### Data Displayed & Where Data Comes From
*   **Promise Content**: Fetched from Firestore `promises` collection based on the current date.
*   **Saved Status**: Fetched from user's sub-collection or an array in the user document to determine if the heart/save icon should be filled.

### User Actions & Navigation Flow
1.  **Tap Back**: Return to previous screen.
2.  **Tap Archive**: Navigate to the list view of all past promises.
3.  **Tap Copy**: Toast "Copied to clipboard".

### States
*   **Empty States**: If no promise is configured for today, show a fallback default promise or a message "Today's promise is being prepared."
*   **Loading States**: Full screen spinner or skeleton UI for the main card.
*   **Error States**: "Failed to load promise. Please try again." with a Retry button.
*   **Success States**: Snackbar confirming "Saved to Favorites" or "Copied".

### Permissions & Notifications
*   **Permissions**: Storage/Photos permission may be requested if sharing as an image (downloading the background).

### Edge Cases
*   **Timezone Differences**: Ensure the promise date is evaluated based on the user's local timezone so they get the correct promise at midnight.

---

## 3. Prayer Screen (Prayer Wall)

### What the Screen Is
A community-driven screen where members can submit prayer requests, view requests from others, and interact by indicating they are praying.

### Purpose of the Screen
To foster community support, allow members to share burdens, and track answers to prayers.

### Every Section, Field, Button, and Icon

#### 1. App Bar (Header)
*   **Screen Title (Field)**: "Prayer Wall".
*   **My Prayers Tab (Button)**: Toggle to view only prayers submitted by the user.
*   **All Prayers Tab (Button)**: Toggle to view community prayers (Active by default).

#### 2. Add Prayer Request (Floating Action Button / Top Banner)
*   **"Add Prayer" Button (Button/FAB)**:
    *   **Action**: Opens the "New Prayer Request" modal/screen.

#### 3. New Prayer Request Modal (Sub-screen)
*   **Title Input (Field)**: e.g., "Praying for healing".
*   **Description Input (Text Area)**: Detailed description of the request.
*   **Anonymous Toggle (Switch)**: Option to hide name.
*   **Submit Button (Button)**: Validates and pushes data to Firestore.
*   **Cancel Button (Button)**: Closes modal.

#### 4. Prayer Feed (List Section)
*   **Prayer Card (List Item)**:
    *   **User Avatar & Name (Field)**: Displayed unless marked anonymous (shows "Anonymous Member").
    *   **Timestamp (Field)**: e.g., "2 hours ago".
    *   **Status Badge (Field)**: "Active" or "Answered".
    *   **Title & Description (Field)**: The actual prayer text. Read more... toggle if text is too long.
    *   **"I'm Praying" Button (Button/Icon)**: Praying hands icon.
        *   **Action**: Increments the prayer count and highlights the button.
    *   **Prayer Count (Field)**: e.g., "15 people are praying".
    *   **Report/Options Menu (Icon - Three Dots)**:
        *   **Action**: Opens bottom sheet to "Report Abuse" (if community) or "Edit/Mark Answered/Delete" (if owned by user).

### Data Displayed & Where Data Comes From
*   **Prayer List**: Fetched from `prayers` collection, ordered by timestamp descending.
*   **Praying Users**: Sub-collection or array of User IDs who clicked "I'm Praying" on a specific request.

### User Actions & Navigation Flow
1.  **Toggle Tabs**: Switch between All/Mine.
2.  **Submit Prayer**: Fill form -> Submit -> Form closes -> List refreshes.
3.  **Tap "I'm Praying"**: Optimistic UI update to increment counter.
4.  **Mark Answered (My Prayers)**: Changes status badge and visual style of the card.

### States
*   **Empty States**:
    *   *All Prayers*: "No prayer requests at the moment. Be the first to share."
    *   *My Prayers*: "You haven't submitted any prayer requests."
*   **Loading States**: List skeleton loader. Submit button shows loading spinner during network request.
*   **Error States**: "Failed to load prayers" (List). "Submission failed" (Modal).
*   **Success States**: Confetti or specific visual feedback when a prayer is marked "Answered". Snackbar on successful submission.

### Permissions & Notifications
*   **Notifications**: Users can receive a push notification when someone clicks "I'm Praying" on their request (configurable in settings).

### Edge Cases
*   **Spam/Abuse**: Implement rate limiting for submissions and a robust report functionality.
*   **Long Texts**: Handle massive text walls with a "Show More/Less" expansion to keep the feed navigable.

---

## 4. Sermon Screen

### What the Screen Is
A multimedia library containing past video and audio sermons, categorized and searchable.

### Purpose of the Screen
To allow members to catch up on missed services, re-watch impactful messages, and consume church content on demand.

### Every Section, Field, Button, and Icon

#### 1. App Bar (Header)
*   **Screen Title (Field)**: "Sermons".
*   **Search Icon (Button)**:
    *   **Action**: Expands a search bar to query sermons by title, preacher, or keyword.

#### 2. Featured / Latest Sermon (Header Section)
*   **Large Video Thumbnail (Image)**: Dominant image of the most recent sermon.
*   **Play Overlay (Icon)**: Large play button.
*   **Title & Date (Fields)**.
*   **Action**: Tapping the thumbnail opens the Video Player Screen.

#### 3. Filter & Category Bar (Horizontal Scroll)
*   **Filter Chips (Buttons)**: e.g., "All", "Series", "Guest Speakers", "Audio Only".
    *   **Action**: Tapping a chip filters the list below. Active chip is highlighted.

#### 4. Sermon List / Grid (Section)
*   **Sermon Item Card**:
    *   **Thumbnail Image (Image)**.
    *   **Duration Badge (Field)**: Overlay on thumbnail (e.g., "45:20").
    *   **Sermon Title (Field)**.
    *   **Preacher Name (Field)**.
    *   **Date (Field)**.
    *   **Options Menu (Three Dots Icon)**:
        *   **Action**: Opens bottom sheet with options: "Share", "Download (Audio)", "Save for later".

#### 5. Sermon Video Player (Sub-screen / Navigation Target)
*   **Video Player Component**:
    *   **Play/Pause, Seek Bar, Fullscreen, Mute (Standard Media Controls)**.
*   **Sermon Details Section**: Below the video. Title, Preacher, Date, Description/Notes.
*   **Related Sermons (List)**: Suggestions based on the current series or preacher.

### Data Displayed & Where Data Comes From
*   **Sermons Metadata**: Fetched from `sermons` collection (title, URL, duration, date, speaker, thumbnail URL).
*   **Media**: Streamed from YouTube API, Vimeo API, or direct cloud storage links depending on backend configuration.

### User Actions & Navigation Flow
1.  **Search**: Type query -> List filters in real-time or on submit.
2.  **Filter**: Tap category -> List updates.
3.  **Play Video**: Tap card -> Navigate to Player Screen -> Video auto-plays (or waits for interaction depending on OS).
4.  **Rotate Device (Player)**: Automatically trigger fullscreen mode if implemented.

### States
*   **Empty States**: "No sermons found matching your search."
*   **Loading States**: Shimmer effect on cards while metadata fetches. Buffering spinner inside the video player.
*   **Error States**: "Video unavailable." "Failed to load sermon list."
*   **Success States**: N/A for standard viewing.

### Permissions & Notifications
*   **Permissions**: None explicitly required for streaming. Storage permission if offline downloading is implemented.

### Edge Cases
*   **Background Audio**: If the user backgrounds the app, video pauses, but if "Audio Only" is selected, it should continue playing using OS background audio services.
*   **Poor Connection**: Player should handle bitrate switching (HLS) or provide clear UI feedback if buffering stalls indefinitely.

---

## 5. Profile Screen

### What the Screen Is
The personal hub for the user to manage their account, app settings, personal records (like giving history), and authentication state.

### Purpose of the Screen
To give the user control over their identity, notification preferences, privacy, and to provide access to account-specific data.

### Every Section, Field, Button, and Icon

#### 1. Header & Identity Section
*   **Profile Image/Avatar (Image/Button)**:
    *   **Action**: Tap to upload/change profile picture (opens device gallery/camera).
*   **User Name (Field)**: Full name.
*   **User Email (Field)**: Email address.
*   **Edit Profile Button (Button)**:
    *   **Action**: Opens a modal to edit First Name, Last Name, Phone Number, etc.

#### 2. Account Information (Section)
*   **Menu Items (List)**:
    *   **My Giving History (Row - Icon + Text + Arrow)**:
        *   **Action**: Navigates to a detailed ledger of past donations/tithes.
    *   **My Saved Promises (Row - Icon + Text + Arrow)**:
        *   **Action**: Navigates to the archive of bookmarked promises.
    *   **My Notes (Row - Icon + Text + Arrow)**:
        *   **Action**: Navigates to the user's personal sermon notes.

#### 3. Settings & Preferences (Section)
*   **Menu Items (List)**:
    *   **Push Notifications (Row - Icon + Text + Toggle Switch)**:
        *   **Action**: Toggles global push notifications on/off. Updates device token in Firestore.
    *   **Dark Mode / Theme (Row - Icon + Text + Toggle/Dropdown)**:
        *   **Action**: Switches app theme between Light, Dark, or System Default.
    *   **Language (Row - Icon + Text + Value)**:
        *   **Action**: Opens a selector for app language if localization is supported.

#### 4. Support & Information (Section)
*   **Menu Items (List)**:
    *   **About Church (Row)**: Navigates to an info screen about the organization.
    *   **Contact Us (Row)**: Opens email client or in-app form to contact admin.
    *   **Privacy Policy (Row)**: Opens webview or browser link.
    *   **Terms of Service (Row)**: Opens webview or browser link.

#### 5. Danger Zone / Auth (Section)
*   **Log Out Button (Button - usually styled in red or distinctively)**:
    *   **Action**: Clears local session, signs out of Firebase, and navigates to the Login/Onboarding screen.
*   **Delete Account Button (Text Link/Button)**:
    *   **Action**: Triggers a high-friction confirmation dialog to permanently delete user data and auth record.

### Data Displayed & Where Data Comes From
*   **User Data**: Fetched from Firebase Auth (Email) and Firestore `users` document (Name, Avatar URL, Preferences).

### User Actions & Navigation Flow
1.  **Change Avatar**: Tap image -> Pick photo -> Uploads to Firebase Storage -> Updates Firestore doc -> UI updates.
2.  **Toggle Settings**: Tap switch -> API call to update preferences -> UI reflects change.
3.  **Log Out**: Tap -> Confirmation Modal ("Are you sure?") -> Confirm -> Navigate to Auth flow.
4.  **Navigate Sub-menus**: Tap row -> Push new screen onto navigation stack.

### States
*   **Empty States**: N/A for the main profile view.
*   **Loading States**: Spinner on the avatar while uploading a new image. Disabled state on the "Log Out" button while the sign-out request is processing.
*   **Error States**: "Failed to update profile picture." "Error saving settings."
*   **Success States**: "Profile updated successfully." (Snackbar).

### Permissions & Notifications
*   **Permissions**: Camera and Photo Library permissions required when attempting to change the profile picture.

### Edge Cases
*   **Social Logins**: If logged in via Google/Apple, the "Change Password" option (if present) should be hidden or disabled, as auth is managed by the provider.
*   **Incomplete Profile**: If a user bypassed onboarding, fields like Phone Number might be empty. Provide visual cues (e.g., "Add Phone Number") to encourage completion.
