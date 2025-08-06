import React, { useState } from "react";

export default function DevTesting({ open, onClose }: { open: boolean, onClose: () => void }) {
  const [activeDevTab, setActiveDevTab] = useState<'google'>('google');
  const [gsStatus, setGsStatus] = useState<string | null>(null);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/70">
      <div className="bg-white w-full max-w-2xl h-[90vh] rounded-lg shadow-lg flex flex-col">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold">Developer Mode</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl">&times;</button>
        </div>
        <div className="flex border-b">
          <button
            className={`px-4 py-2 ${activeDevTab === 'google' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
            onClick={() => setActiveDevTab('google')}
          >
            Google Services
          </button>
        </div>
        <div className="flex-1 overflow-auto p-6">
          {activeDevTab === 'google' && (
            <div>
              <button
                onClick={async () => {
                  setGsStatus('Sending...');
                  const testSale = {
                    saleDate: new Date().toISOString(),
                    customer: 'Test Customer',
                    amount: 123.45,
                    product: 'Test Product',
                  };
                  const month = new Date().toLocaleString('en-US', { month: 'long' });
                  try {
                    const res = await fetch('https://db.techpinoy.net/functions/v1/google-sheets-handler', {
                        method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        sheet: month,
                        data: testSale,
                      }),
                    });
                    if (res.ok) {
                      setGsStatus('Success! Data sent to Google Sheet.');
                    } else {
                      setGsStatus('Failed! Server error.');
                    }
                  } catch (err) {
                    setGsStatus('Failed! Network or CORS error.');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send Test Data to Google Sheet
              </button>
              {gsStatus && <div style={{ marginTop: 8 }}>{gsStatus}</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
