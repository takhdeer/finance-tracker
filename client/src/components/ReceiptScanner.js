import { useState } from 'react';
import Tesseract from 'tesseract.js';

function ReceiptScanner({ onReceiptScanned }) { 
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);

    const handleImageUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected')
            return;
        }

        console.log('File selected', file.name, file.type, file.size);

        if (!file.type.startsWith('image/')) {
            alert('Please select an image file')
            return;
        }

        // OCR processing
        setIsProcessing(true);
        setProgress(0);

        // read file as base64
        const reader = new FileReader();

        reader.onload = async (e) => {
            console.log('File loaded, starting OCR...');
            const imageData = e.target.result;
            setPreviewImage(imageData);

            try {
                const result = await Tesseract.recognize(
                    imageData,
                    'eng',
                    {
                        logger: (m) => {
                            if (m.status === 'recognizing text') {
                                setProgress(Math.round(m.progress * 100));
                            }
                        }
                    }
                );

                const extractedText = result.data.text;
                console.log('Extracted text', extractedText)
                
                //Parse the text to extract data
                const parsedData = parseReceiptText(extractedText);
                console.log('Parsed data:', parsedData);

                // Data sent back to parent component
                if (onReceiptScanned) {
                    onReceiptScanned(parsedData);
                }

                alert('Receipt scanned sucessfully');
            }   catch (error) { 
                console.error('OCR Error:', error);
                alert('Failed to scan receipt. Please try again.');
            }   finally {
                setIsProcessing(false);
                setProgress(0);
                setPreviewImage(null);
            }
        };

        reader.onerror = () => {
            alert('Failed to read image file');
            setIsProcessing(false);
        };
    
        reader.readAsDataURL(file);
    };


    const parseReceiptText = (text) => {
        //basic parser to be improved later
        const lines = text.split('\n').map(line => line.trim()).filter(line => line);

        let amount = '';
        let merchant = '';
        let date = '';

        // finding amount imporoved (with total, amount due, etc)
        const totalKeywords = ['total', 'amount due', 'balance', 'grand total', 'subtotal'];
        let foundTotal = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].toLowerCase();

            const hasKeyword = totalKeywords.some(keyword => line.includes(keyword));

            if (hasKeyword || foundTotal) {
                // look for amouunt pattern in that or the next line
                const amountMatch = lines[i].match(/\$?\s*(\d+\.\d{2})/);
                if (amountMatch) {
                    amount = amountMatch[1];
                    foundTotal = true;
                    break;
                }

                if (i + 1 <lines.length) {
                    const nextMatch = lines[i + 1].match(/\$?\s*(\d+\.\d{2})/);
                    if (nextMatch) {
                        amount = nextMatch[1];
                        break;
                    }
                }
            }
        }

        // if no amount found, get largest amount
        if (!amount) {
            const amounts = [];
            for (let line of lines) {
                const matches = line.match(/\$?\s*(\d+\.\d{2})/g);
                if (matches) {
                    matches.forEach(match => {
                        const num = parseFloat(match.replace('$', '').trim());
                        if (num >0) amounts.push(num);
                    });
                }
            }
            if (amounts.length > 0) {
                amount = Math.max(...amounts).toFixed(2);
            }
        }

        // Skip lines that are just numbers, dates, or very short
        for (let line of lines) {
            if (line.length >= 3 && 
                !line.match(/^\d+$/) && 
                !line.match(/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}$/) &&
                !line.match(/^\$?\d+\.\d{2}$/)) {
                    merchant = line;
                    break;
            }
        }

        // finding date in multiple formats
        const datePatterns = [
            /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/,  // MM/DD/YYYY or MM-DD-YYYY
            /(\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2})/,    // YYYY/MM/DD
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}/i  // Jan 15, 2024
        ];

        for (let line of lines) {
            for (let pattern of datePatterns) {
                const dateMatch = line.match(pattern)
                if (dateMatch && !date) {
                    const dateStr = dateMatch[0];
                    date = parseDate(dateStr);
                    if (date) break;
                }
            }
            if (date) break;
        }

        return {
            amount: amount || '',
            merchant: merchant || '',
            date: date || new Date().toISOString().split('T')[0],
            category: 'Other',
            notes: 'Scanned from receipt'
        };
    };

    const parseDate = (dateStr) => {
        try {
            // Try MM/DD/YYYY or MM-DD-YYYY
            let match = dateStr.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
            if (match) {
                let month = match[1].padStart(2, '0');
                let day = match[2].padStart(2, '0');
                let year = match[3];
                if (year.length === 2) year = '20' + year;
                return `${year}-${month}-${day}`;
            }
        
            // Try YYYY/MM/DD
            match = dateStr.match(/(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/);
            if (match) {
                let year = match[1];
                let month = match[2].padStart(2, '0');
                let day = match[3].padStart(2, '0');
                return `${year}-${month}-${day}`;
            }

            const months = {
                jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
                jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
            };
            match = dateStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})/i);
            if (match) {
                const month = months[match[1].toLowerCase().substring(0, 3)];
                const day = match[2].padStart(2, '0');
                const year = match[3];
                return `${year}-${month}-${day}`;
            }

            return null;
        }   catch (e) {
                return null;
            }
    };
    return (
        <div style = {styles.container}>
            <h3>Scan Receipt</h3>

            <input
                type = "file"
                accept = "image/*"
                capture = "environment"
                onChange = {handleImageUpload}
                style = {styles.fileInput}
                id= "receipt-upload"
                disabled={isProcessing}
            />

            <label htmlFor="receipt-upload" style={styles.uploadButton}>
                {isProcessing ?`Processing... ${progress}%` : '📷 Take Photo or Upload Receipt'}
            </label>

            {previewImage && (
                <div style={styles.preview}>
                <img src={previewImage} alt="Receipt preview" style={styles.previewImage} />
                </div>
            )}

            {isProcessing && (
                <div style={styles.progressBar}>
                    <div style={{...styles.progressFill, width: `${progress}%`}}></div>
                </div>
            )}
        </div>
    );
};

const styles = {
    container: {
        maxWidth: '500px',
        margin: '20px auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '12px',
        backgroundColor: '#f9f9f9',
        textAlign: 'center'
    },
    fileInput: {
    display: 'none'
    },
    uploadButton: {
        display: 'block',
        width: '100%',
        padding: '15px',
        backgroundColor: '#2196F3',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px'
    },
    preview: {
        marginTop: '20px'
    },
    previewImage: {
        maxWidth: '100%',
        maxHeight: '300px',
        borderRadius: '8px',
        border: '2px solid #ddd'
    },
    progressBar: {
        width: '100%',
        height: '20px',
        backgroundColor: '#e0e0e0',
        borderRadius: '10px',
        marginTop: '15px',
        overflow: 'hidden'
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4CAF50',
        transition: 'width 0.3s ease'
    }   
};

export default ReceiptScanner;