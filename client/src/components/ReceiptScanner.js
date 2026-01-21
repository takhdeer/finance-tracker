import { useState } from 'react';
import Tesseract from 'tesseract.js';

function ReceiptScanner({ onReceiptScanned }) { 
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [previewImage, setPreviewImage] = useState(null);
    const [showReview, setShowReview] = useState(false);
    const [reviewData, setReviewData] = useState(null);
    const [extractedText, setExtractedText] = useState('');

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
                    setReviewData(parsedData);
                    setExtractedText(extractedText);
                    setShowReview(true);

                }

                alert('Receipt scanned sucessfully');
            }   catch (error) { 
                console.error('OCR Error:', error);
                alert('Failed to scan receipt. Please try again.');
            }   finally {
                setIsProcessing(false);
                setProgress(0);
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

    const handleConfirmScan = () => {
        // Send reviewed data to parent
        if (onReceiptScanned) {
            onReceiptScanned(reviewData)
        }

        // Reset 
        setShowReview(false);
        setReviewData(null);
        setExtractedText('');
        setPreviewImage(null);
        alert('Receipt data added to form!');
    };

    const handleCancelScan = () => {
        //Discard and reset
        setShowReview(false);
        setReviewData(null);
        setExtractedText('');
        setPreviewImage(null);
    };

    const handleReviewChange = (field, value) => {
        setReviewData({
            ...reviewData,
            [field]: value
        });
    };

    return (
        <div style = {styles.container}>
            <h3>Scan Receipt</h3>

            {!showReview ? (
                <>
                    <input
                        type = "file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleImageUpload}
                        style={styles.fileInput}
                        id="receipt-upload"
                        disabled={isProcessing}
                    />

                    <label htmlFor="receipt-upload" style={styles.uploadButton}>
                        {isProcessing ? `Processing... ${progress}%` : '📷 Take Photo or Upload Receipt'}
                    </label>

                    {previewImage && !isProcessing && (
                        <div style={styles.preview}>
                            <img src={previewImage} alt="Receipt preview" style={styles.previewImage} />
                        </div>
                    )}

                    {isProcessing && (
                        <div style = {styles.progressBar}>
                            <div style={{...styles.progressFill, width: `${progress}%`}}></div>
                        </div>
                    )}
                </>
            ) : (
                // Review view
                <div style = {styles.reviewContainer}>
                    <h4 style = {{marginTop: 0, color: '#2196F3'}}>Review Scanned Data </h4>

                    {previewImage && (
                        <div style={styles.reviewPreview}>
                            <img src={previewImage} alt="Receipt" style={styles.reviewImage} />
                        </div>
                    )}
                    <div style = {styles.reviewForm}>
                        <div style = {styles.formGroup}>
                            <label style={styles.label}>Amount ($)</label>
                            <input
                                type="number"
                                step="0.01"
                                value={reviewData.amount}
                                onChange={(e) => handleReviewChange('amount', e.target.value)}
                                style={styles.input}
                            />
                        </div>
                        
                        <div style= {styles.formGroup}>
                            <label style = {styles.label}>Merchant</label>
                            <input
                                type = "text"
                                value = {reviewData.merchant}
                                onChange={(e) => handleReviewChange('merchant', e.target.value)}
                                style = {styles.input}
                            />
                        </div>

                        <div style = {styles.formGroup}>
                            <label style={styles.label}>Date</label>
                            <input
                                type="date"
                                value={reviewData.date}
                                onChange={(e) => handleReviewChange('date', e.target.value)}
                                style={styles.input}
                            />
                        </div>

                        <div style = {styles.formGroup}>
                            <label style = {styles.label}>Category</label>
                            <select 
                                value={reviewData.category}
                                onChange={(e) => handleReviewChange('category', e.target.value)}
                                style={styles.input}
                            >
                                <option value="Food">Food</option>
                                <option value="Transport">Transport</option>
                                <option value="Shopping">Shopping</option>
                                <option value="Bills">Bills</option>
                                <option value="Entertainment">Entertainment</option>
                                <option value="Other">Other</option> 
                            </select>
                        </div>

                        <div style = {styles.formGroup}>
                            <label style = {styles.label}>Notes</label>
                            <textarea
                                value={reviewData.notes}
                                onChange = {(e) => handleReviewChange('notes', e.target.value)}
                                style = {styles.textarea}
                            />
                        </div>
                    </div>

                    {/* raw OCR text for debugging */}
                    <details style = {{marginTop: '25px', fontSize: '12px', color: '#666'}}>
                        <summary style = {{cursor: 'pointer'}}>Show raw OCR text</summary>
                        <pre style= {{
                            backgroundColor: '#f5f5f5',
                            padding: '10px',
                            borderRadius: '4px',
                            overflow: 'auto',
                            maxHeight: '150px',
                            fontSize: '11px'
                        }}>
                            {extractedText}
                        </pre>
                    </details>

                    <div style = {styles.reviewButtons}>
                        <button onClick={handleConfirmScan} style = {styles.confirmButton}>
                            ✓ Confirm & Add
                        </button>
                        <button onClick = {handleCancelScan} style = {styles.cancelButton}>
                            ✗ Cancel
                        </button>
                    </div>
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
    formGroup: {
        marginBottom: '25px',
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
    },

    reviewContainer: {
        textAlign: 'left'
    },
    reviewPreview: {
        marginBottom: '15px',
        textAlign: 'center'
    },
    reviewImage: {
        maxWidth: '200px',
        maxHeight: '150px',
        borderRadius: '8px',
        border: '2px solid #ddd'
    },
    reviewForm: {
        marginTop: '15px',
        paddingLeft: '15px'
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#333'
    },
    textarea: {
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        borderRadius: '6px',
        border: '1px solid #ddd',
        minHeight: '60px',
        boxSizing: 'border-box',
        fontFamily: 'inherit',

    },
    input: {
        textAlign: 'center'
    },
    reviewButtons: {
        display: 'flex',
        gap: '10px',
        marginTop: '20px'
    },
    confirmButton: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#4CAF50',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer'
    },
    cancelButton: {
        flex: 1,
        padding: '12px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '16px',
        fontWeight: 'bold',
        cursor: 'pointer'
    }
};

export default ReceiptScanner;