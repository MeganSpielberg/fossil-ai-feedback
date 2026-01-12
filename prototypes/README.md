# Fossil AI Feedback Prototypes

This folder contains a small React app used for a usability study.
Users capture photos using three prototypes and the app uploads the results to Supabase.

The image quality analysis runs in the browser.
There is no remote analysis service in this prototype app.

## Quick start

Install dependencies:

`npm install`

Create a `.env` file in this folder with:

`VITE_SUPABASE_URL=...`
`VITE_SUPABASE_KEY=...`

Run the dev server:

`npm run dev`

## How the app works

The main state machine is in `src/App.jsx`.

1. On load, the app fetches a testing order from Supabase.
2. The Home page collects submission details.
3. The user completes the next prototype in their assigned order.
4. Each prototype captures images locally.
5. When all three prototypes are done, the app uploads all images and writes database records.

## Prototypes

Prototype 1 is baseline capture.
It provides no automated analysis.

Prototype 2 shows post capture feedback.
Each captured image is analyzed after capture.

Prototype 3 shows real time feedback.
It analyzes frames on an interval while the camera is active.

## Image analysis

`src/utils/imageAnalysis.js` computes:

- Lighting mean from the grayscale image
- Sharpness using variance of Laplacian
- Contrast using center versus edge brightness difference

Each metric is rated on five levels.
The UI displays three levels by mapping those ratings into three feedback types:

- warning for very poor and poor
- info for intermediate
- success for good and very good

The UI uses the feedback type to pick colors.

## Supabase usage

This app uses Supabase for:

- Database tables
- Storage bucket named `submissions` for uploaded images

Environment variables are read in `src/utils/supabase.js`.

Tables used by the app:

`testing_orders`
- `order_sequence` string like `p1,p2,p3`
- `completions` number

`submissions`
- `username`
- `title`
- `location`
- `testing order` stores the selected `testing_orders.id`
- `device` JSON object

`submission_prototype`
- `submission_id` foreign key to `submissions.id`
- `prototype_name` string like `Prototype 1`
- `time_spent` JSON object
- `flashlight_used` boolean

`images`
- `filename`
- `image_url`
- `submission_prototype_id` foreign key to `submission_prototype.id`

## Key files

`src/App.jsx` controls navigation and submission lifecycle.
`src/api.jsx` contains local analysis and Supabase submission logic.
`src/pages/HomePage.jsx` collects user inputs and shows assigned prototype order.
`src/pages/prototypes/Prototype1.jsx` capture only.
`src/pages/prototypes/Prototype2.jsx` capture plus post capture feedback.
`src/pages/prototypes/Prototype3.jsx` capture plus real time feedback.
`src/pages/prototypes/components/CameraView.jsx` shared camera UI.
`src/pages/prototypes/components/AlbumModal.jsx` review and submit.
`src/utils/useTimeTracking.js` tracks time spent in instructions and active use.

