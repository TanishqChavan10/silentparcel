// If you want to create Database Tables and Schemas use this script, bit old update it using the sql file given in code
const { Client, Databases, Storage, ID } = require('appwrite');

// Initialize Appwrite client
const client = new Client();
client
  .setEndpoint('https://cloud.appwrite.io/v1') // Replace with your endpoint if using self-hosted
  .setProject('YOUR_PROJECT_ID') // Replace with your project ID
  .setKey('YOUR_API_KEY'); // Replace with your API key

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = 'file_sharing_db';

async function setupAppwrite() {
  try {
    console.log('Setting up Appwrite database and collections...');

    // Create database
    try {
      const database = await databases.create(DATABASE_ID, 'File Sharing Database');
      console.log('✅ Database created:', database.name);
    } catch (error) {
      if (error.code === 409) {
        console.log('✅ Database already exists');
      } else {
        throw error;
      }
    }

    // Create collections
    const collections = [
      {
        id: 'files',
        name: 'Files',
        attributes: [
          { key: 'originalName', type: 'string', size: 255, required: true },
          { key: 'size', type: 'integer', required: true },
          { key: 'mimeType', type: 'string', size: 100, required: true },
          { key: 'downloadToken', type: 'string', size: 64, required: true },
          { key: 'editToken', type: 'string', size: 64, required: true },
          { key: 'password', type: 'string', size: 255, required: false },
          { key: 'expiryDate', type: 'datetime', required: false },
          { key: 'maxDownloads', type: 'integer', required: false },
          { key: 'downloadCount', type: 'integer', required: true, default: 0 },
          { key: 'isActive', type: 'boolean', required: true, default: true },
          { key: 'uploadedAt', type: 'datetime', required: true },
          { key: 'uploadedBy', type: 'string', size: 45, required: true },
          { key: 'lastDownloadedAt', type: 'datetime', required: false }
        ],
        indexes: [
          { key: 'downloadToken', type: 'unique', attributes: ['downloadToken'] },
          { key: 'editToken', type: 'unique', attributes: ['editToken'] },
          { key: 'uploadedAt', type: 'key', attributes: ['uploadedAt'] }
        ]
      },
      {
        id: 'chat_rooms',
        name: 'Chat Rooms',
        attributes: [
          { key: 'name', type: 'string', size: 100, required: true },
          { key: 'password', type: 'string', size: 20, required: true },
          { key: 'createdBy', type: 'string', size: 50, required: true },
          { key: 'createdAt', type: 'datetime', required: true },
          { key: 'isActive', type: 'boolean', required: true, default: true },
          { key: 'maxUsers', type: 'integer', required: true, default: 10 },
          { key: 'userCount', type: 'integer', required: true, default: 0 },
          { key: 'lastActivity', type: 'datetime', required: false }
        ],
        indexes: [
          { key: 'password', type: 'key', attributes: ['password'] },
          { key: 'createdAt', type: 'key', attributes: ['createdAt'] }
        ]
      },
      {
        id: 'users',
        name: 'Users',
        attributes: [
          { key: 'username', type: 'string', size: 50, required: true },
          { key: 'avatar', type: 'string', size: 255, required: true },
          { key: 'roomId', type: 'string', size: 50, required: true },
          { key: 'isCreator', type: 'boolean', required: true, default: false },
          { key: 'joinedAt', type: 'datetime', required: true },
          { key: 'isActive', type: 'boolean', required: true, default: true },
          { key: 'isMuted', type: 'boolean', required: false, default: false },
          { key: 'lastSeen', type: 'datetime', required: false }
        ],
        indexes: [
          { key: 'roomId', type: 'key', attributes: ['roomId'] },
          { key: 'username', type: 'key', attributes: ['username'] }
        ]
      },
      {
        id: 'chat_messages',
        name: 'Chat Messages',
        attributes: [
          { key: 'roomId', type: 'string', size: 50, required: true },
          { key: 'userId', type: 'string', size: 50, required: true },
          { key: 'username', type: 'string', size: 50, required: true },
          { key: 'message', type: 'string', size: 1000, required: true },
          { key: 'messageType', type: 'string', size: 20, required: true, default: 'text' },
          { key: 'sentAt', type: 'datetime', required: true },
          { key: 'fileId', type: 'string', size: 50, required: false },
          { key: 'fileName', type: 'string', size: 255, required: false }
        ],
        indexes: [
          { key: 'roomId', type: 'key', attributes: ['roomId'] },
          { key: 'sentAt', type: 'key', attributes: ['sentAt'] }
        ]
      }
    ];

    // Create each collection
    for (const collection of collections) {
      try {
        const createdCollection = await databases.createCollection(
          DATABASE_ID,
          collection.id,
          collection.name
        );
        console.log(`✅ Collection created: ${collection.name}`);

        // Create attributes
        for (const attr of collection.attributes) {
          try {
            if (attr.type === 'string') {
              await databases.createStringAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.size,
                attr.required,
                attr.default
              );
            } else if (attr.type === 'integer') {
              await databases.createIntegerAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                undefined,
                undefined,
                attr.default
              );
            } else if (attr.type === 'boolean') {
              await databases.createBooleanAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                attr.default
              );
            } else if (attr.type === 'datetime') {
              await databases.createDatetimeAttribute(
                DATABASE_ID,
                collection.id,
                attr.key,
                attr.required,
                attr.default
              );
            }
            console.log(`  ✅ Attribute created: ${attr.key}`);
          } catch (error) {
            if (error.code === 409) {
              console.log(`  ✅ Attribute already exists: ${attr.key}`);
            } else {
              console.error(`  ❌ Error creating attribute ${attr.key}:`, error.message);
            }
          }
        }

        // Wait for attributes to be available
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Create indexes
        for (const index of collection.indexes) {
          try {
            await databases.createIndex(
              DATABASE_ID,
              collection.id,
              index.key,
              index.type,
              index.attributes
            );
            console.log(`  ✅ Index created: ${index.key}`);
          } catch (error) {
            if (error.code === 409) {
              console.log(`  ✅ Index already exists: ${index.key}`);
            } else {
              console.error(`  ❌ Error creating index ${index.key}:`, error.message);
            }
          }
        }

      } catch (error) {
        if (error.code === 409) {
          console.log(`✅ Collection already exists: ${collection.name}`);
        } else {
          console.error(`❌ Error creating collection ${collection.name}:`, error.message);
        }
      }
    }

    // Create storage buckets
    const buckets = [
      { id: 'files_bucket', name: 'Files Bucket' },
      { id: 'avatars_bucket', name: 'Avatars Bucket' }
    ];

    for (const bucket of buckets) {
      try {
        const createdBucket = await storage.createBucket(
          bucket.id,
          bucket.name,
          ['read("any")', 'write("any")'], // Permissions
          false, // File security
          true, // Enabled
          104857600, // Max file size (100MB)
          ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx', 'txt', 'zip', 'rar', '7z', 'mp4', 'mp3', 'wav'], // Allowed file extensions
          'gzip', // Compression
          false, // Encryption
          false // Antivirus
        );
        console.log(`✅ Bucket created: ${bucket.name}`);
      } catch (error) {
        if (error.code === 409) {
          console.log(`✅ Bucket already exists: ${bucket.name}`);
        } else {
          console.error(`❌ Error creating bucket ${bucket.name}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Appwrite setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your .env.local file with the project ID and API key');
    console.log('2. Set up Supabase for audit logs');
    console.log('3. Install and run Redis');

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupAppwrite();
