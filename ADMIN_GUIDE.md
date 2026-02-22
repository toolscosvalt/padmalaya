# Padmalaya Admin Guide

## Accessing the Admin Panel

Navigate to: `https://your-website.com/#/admin`

The admin panel is now password-protected. You'll need to log in with your admin credentials.

## Setting Up Admin Credentials

### First Time Setup

You need to create an admin user in Supabase:

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "Authentication" in the left sidebar
4. Click "Add User" button
5. Enter:
   - Email: `admin@padmalaya.com` (or your preferred admin email)
   - Password: Create a strong password
   - Email Confirm: Toggle ON (so you don't need to verify email)
6. Click "Create User"

**Important**: Save your admin password securely! You'll need it to access the admin panel.

### Logging In

1. Go to `https://your-website.com/#/admin`
2. Enter your admin email and password
3. Click "Login"

Once logged in, you can manage all projects and images. Click "Logout" in the top-right when done.

## Direct URL Access

The website now supports direct URL navigation:

- **Home**: `https://your-website.com/` or `https://your-website.com/#/`
- **About**: `https://your-website.com/#/about`
- **Projects**: `https://your-website.com/#/projects`
- **Contact**: `https://your-website.com/#/contact`
- **Admin**: `https://your-website.com/#/admin`
- **Specific Project**: `https://your-website.com/#/project/project-slug-name`

You can share these URLs directly, and they will work when opened in a new browser tab.

## Managing Projects

### Adding a New Project

1. Click "Add New Project" button
2. Fill in all required fields (marked with *)
3. Important fields:
   - **Name**: The project name (e.g., "Gagnanchal Housing")
   - **Slug**: Auto-generated from name, used in URLs
   - **Status**: Choose "completed" or "ongoing"
   - **External URL**: Only for ongoing projects - if set, clicking the project redirects here instead of showing detail page
   - **Hero Image URL**: Main image shown on listing page (get from Google Drive)
   - **Display Order**: Lower numbers appear first
   - **Featured**: Show on homepage (select Yes/No)

### Editing a Project

1. Click the edit icon (pencil) next to any project
2. Modify the fields you want to change
3. Click "Save Project"

### Deleting a Project

1. Click the delete icon (trash) next to the project
2. Confirm deletion (warning: this also deletes all project images)

## Managing Images

### Adding Images to a Project

1. Find the project you want to add images to
2. Click "Add Image" in the Images section
3. Fill in:
   - **Image URL**: Paste the Google Drive link (see below for format)
   - **Category**: Choose from:
     - Exterior: Building exterior shots
     - Interior: Interior apartment/unit photos
     - Common Areas: Lobby, gym, pool, etc.
     - Location: Surrounding area, maps
     - Uncategorized: General photos
   - **Caption**: Optional description
   - **Display Order**: Order within the category (0 = first)

### Deleting Images

1. Hover over the image thumbnail
2. Click the delete button that appears
3. Confirm deletion

## Google Drive Image Links

### How to Get Shareable Links from Google Drive

1. Upload your image to Google Drive
2. Right-click the image → "Share" → "Get link"
3. Set permissions to "Anyone with the link can view"
4. Copy the link

### Converting Google Drive Links for Direct Display

Google Drive links look like this:
```
https://drive.google.com/file/d/1ABC123XYZ/view?usp=sharing
```

To use them on the website, convert them to:
```
https://drive.google.com/uc?export=view&id=1ABC123XYZ
```

Just replace:
- `https://drive.google.com/file/d/` with `https://drive.google.com/uc?export=view&id=`
- Remove `/view?usp=sharing`

**OR** use a service like `https://www.labnol.org/embed/google/drive/` to get direct image URLs.

**BEST OPTION**: Use Pexels (free stock photos) for now, or upload to an image hosting service that gives you direct image URLs.

## Setting External URLs for Ongoing Projects

For projects like "Padmalaya Dezire Homes" that have their own dedicated website:

1. Edit the project
2. In the "External URL" field, paste the full website URL
   - Example: `https://padmalaya-dezire-homes.com`
   - Must include `https://` or `http://`
3. Save the project
4. Now when visitors click this project anywhere on the site (homepage, projects page), they'll be redirected to that URL in a new tab

**How it works:**
- If a project has an `external_url` set, clicking it opens that URL in a new tab
- If no `external_url` is set, clicking opens the project detail page
- This is perfect for ongoing projects with dedicated marketing websites
- Works on both homepage featured projects and the main projects listing page

## Tips

1. **Image Order**: Lower display order numbers appear first (0, 1, 2, etc.)
2. **Categories**: Images are automatically grouped by category on the detail page
3. **Featured Projects**: Only feature 3-4 projects max for the homepage
4. **Hero Images**: Choose high-quality, landscape-oriented images
5. **Backup**: Before deleting anything, make sure you have a copy

## Database Direct Access

If you need to make bulk changes, you can also:
1. Log into Supabase dashboard
2. Go to Table Editor
3. Directly edit the `projects` and `project_images` tables

### Tables Structure

**projects table:**
- id, name, slug, tagline, description, location, status
- external_url, hero_image_url, year_completed, total_units
- total_area, display_order, is_featured, created_at, updated_at

**project_images table:**
- id, project_id, image_url, category, display_order, caption, created_at

## Updating Logo

To change the logo:
1. Replace `/public/logo.svg` with your new logo file
2. Or update the image source in:
   - `/src/components/Navigation.tsx`
   - `/src/components/Footer.tsx`

## Need Help?

If you encounter any issues or need custom modifications, the code is well-organized:
- Pages: `/src/pages/`
- Components: `/src/components/`
- Database config: `/src/lib/supabase.ts`
