// to delete all the sample files and save storage

// Load environment variables
const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const sdk = require('node-appwrite');

const {
    NEXT_PUBLIC_APPWRITE_ENDPOINT,
    NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    // NEXT_PUBLIC_APPWRITE_BUCKET_KEY,
} = process.env;

const missingVars = [];
if (!NEXT_PUBLIC_APPWRITE_ENDPOINT) missingVars.push('NEXT_PUBLIC_APPWRITE_ENDPOINT');
if (!NEXT_PUBLIC_APPWRITE_PROJECT_ID) missingVars.push('NEXT_PUBLIC_APPWRITE_PROJECT_ID');
if (!APPWRITE_API_KEY) missingVars.push('APPWRITE_API_KEY');
// if (!NEXT_PUBLIC_APPWRITE_BUCKET_KEY) missingVars.push('NEXT_PUBLIC_APPWRITE_BUCKET_KEY');

if (missingVars.length > 0) {
    console.error(
        `❌ Missing required environment variables: ${missingVars.join(', ')}`
    );
    process.exit(1);
}

// Initialize Appwrite client
const client = new sdk.Client()
    .setEndpoint(NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(NEXT_PUBLIC_APPWRITE_PROJECT_ID)
    .setKey(APPWRITE_API_KEY);

// Initialize Storage SDK
const storage = new sdk.Storage(client);

// Async function to delete all files in the bucket using correct queries param
(async () => {
    try {
        const bucketId = "files_bucket";
        let totalDeleted = 0;
        let cursor = undefined;
        const limit = 100;

        while (true) {
            // Retrieve a batch of files with correct queries param (must be array)
            const fileList = await storage.listFiles(bucketId, [
                sdk.Query.limit(limit),
                ...(cursor ? [sdk.Query.cursorAfter(cursor)] : [])
            ]);

            if (!fileList.files || fileList.files.length === 0) break;

            // Loop through and delete files
            for (const file of fileList.files) {
                try {
                    await storage.deleteFile(bucketId, file.$id);
                    console.log(`✅ Deleted file: ${file.$id}`);
                    totalDeleted++;
                } catch (deleteErr) {
                    console.error(`❌ Failed to delete file ${file.$id}:`, deleteErr.message || deleteErr);
                }
            }

            if (fileList.files.length < limit) break;
            cursor = fileList.files[fileList.files.length - 1].$id;
        }

        console.log(`🎉 Successfully deleted ${totalDeleted} files from bucket "${bucketId}".`);
    } catch (error) {
        // Show error message similar to file_context_0
        console.error('❌ Error while deleting files:', error.message || error);
        process.exit(1);
    }
})();
