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
            alert('Please scelect an image file')
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

                alert('Reciept scanned sucessfully');
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
            alert('failed to ead image file');
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

        // finding amount
        for (let line of lines) { 
            const amountMatch = line.match(/\$?\d+\.\d{2}/);        // line match from claude AI
            if (amountMatch && !amount) {
                amount = amountMatch[0].replace('$', '');
            }
        }

        //empty line is usually merchant
        if (lines.length > 0) { 
            merchant = lines[0];
        }

        // finding date 
        for (let line of lines) { 
            const dateMatch = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)       // line match from claude AI
            if (dateMatch && !date) { 
                date = dateMatch[0];
                // convert to yyyy-mm-dd 
                const parts = date.split(/[\/\-]/);
                if (parts.length === 3) {
                    const month = parts[0].padStart(2, '0');
                    const day = parts[1].padStart(2, '0');
                    let year = parts[2];
                    if (year.length === 2) year = '20' + year;
                    date = `${year}-${month}-${day}`;
                }
            }
        }

        return {
            amount: amount || '',
            merchant: merchant || '',
            date: date || new date().toISOString().split('T')[0],
            category: 'Other',
            notes: 'Scanned from receipt'
        };
    };

    return (
        <div style = {styles.container}>
            <h3>Scan Reciept</h3>

            <input
                type = "file"
                accept = "image/*"
                capture = "enviroment"
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