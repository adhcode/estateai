/**
 * Test Image Upload Service
 * Run with: node test-image-upload.js
 */

// Load environment variables
require('dotenv').config();

const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testImgBBUpload() {
    console.log('\n🧪 Testing ImgBB Upload...');

    const apiKey = process.env.IMGBB_API_KEY;

    if (!apiKey) {
        console.log('⚠️  IMGBB_API_KEY not set - skipping ImgBB test');
        console.log('💡 Get API key from: https://api.imgbb.com/');
        return false;
    }

    try {
        // Create a simple test image (1x1 pixel PNG)
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );

        const form = new FormData();
        form.append('image', testImageBuffer.toString('base64'));

        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${apiKey}`,
            form,
            {
                headers: form.getHeaders(),
                timeout: 30000,
            }
        );

        if (response.data?.data?.url) {
            console.log('✅ ImgBB upload successful!');
            console.log(`📸 Image URL: ${response.data.data.url}`);

            // Test if URL is accessible
            const testAccess = await axios.head(response.data.data.url);
            console.log(`✅ Image is publicly accessible (Status: ${testAccess.status})`);

            return true;
        } else {
            console.log('❌ Invalid response from ImgBB');
            return false;
        }
    } catch (error) {
        console.log('❌ ImgBB upload failed');
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Response:', JSON.stringify(error.response.data));
        }
        return false;
    }
}

async function testImgurUpload() {
    console.log('\n🧪 Testing Imgur Upload (Anonymous)...');

    try {
        // Create a simple test image
        const testImageBuffer = Buffer.from(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            'base64'
        );

        const form = new FormData();
        form.append('image', testImageBuffer.toString('base64'));

        const response = await axios.post(
            'https://api.imgur.com/3/image',
            form,
            {
                headers: {
                    ...form.getHeaders(),
                    'Authorization': 'Client-ID 546c25a59c58ad7', // Public anonymous client ID
                },
                timeout: 30000,
            }
        );

        if (response.data?.data?.link) {
            console.log('✅ Imgur upload successful!');
            console.log(`📸 Image URL: ${response.data.data.link}`);

            // Test if URL is accessible
            const testAccess = await axios.head(response.data.data.link);
            console.log(`✅ Image is publicly accessible (Status: ${testAccess.status})`);

            return true;
        } else {
            console.log('❌ Invalid response from Imgur');
            return false;
        }
    } catch (error) {
        console.log('❌ Imgur upload failed');
        console.log('Error:', error.message);
        if (error.response) {
            console.log('Response status:', error.response.status);
            console.log('Response data:', JSON.stringify(error.response.data));
        }
        return false;
    }
}

async function runTests() {
    console.log('🚀 Image Upload Service Test\n');
    console.log('This will test if image hosting services are working correctly.');
    console.log('WhatsApp requires publicly accessible image URLs.\n');

    const imgurWorks = await testImgurUpload();
    const imgbbWorks = await testImgBBUpload();

    console.log('\n📊 Test Results:');
    console.log('─────────────────────────────────────');
    console.log(`Imgur:     ${imgurWorks ? '✅ Working' : '❌ Failed'}`);
    console.log(`ImgBB:     ${imgbbWorks ? '✅ Working' : '⚠️  Not configured or failed'}`);
    console.log('─────────────────────────────────────\n');

    if (imgurWorks) {
        console.log('✅ System is ready! Imgur is working.');
        console.log('💡 Visitor cards will be uploaded to Imgur automatically.\n');
    } else if (imgbbWorks) {
        console.log('✅ System is ready! ImgBB is working.');
        console.log('💡 Visitor cards will be uploaded to ImgBB.\n');
    } else {
        console.log('❌ No working image hosting service found!');
        console.log('\n📝 SOLUTION: Get a free ImgBB API key');
        console.log('   1. Visit: https://api.imgbb.com/');
        console.log('   2. Sign up (takes 30 seconds)');
        console.log('   3. Copy your API key');
        console.log('   4. Add to backend/.env: IMGBB_API_KEY=your_key_here');
        console.log('   5. Run this test again\n');
        console.log('💡 Imgur may be blocked by your network/firewall.');
        console.log('💡 ImgBB is more reliable for production use.\n');
        process.exit(1);
    }
}

// Run tests
runTests().catch(console.error);
