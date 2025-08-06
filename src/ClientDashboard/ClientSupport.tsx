import React from 'react';

export function ClientSupport() {
  return (
    <div className="space-y-6">
      <div className="text-center py-8">
        <div className="bg-orange-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">🚧 We're Still Working on This Section</h3>
        <p className="text-gray-600 mb-2">Hi there! <span role="img" aria-label="wave">👋</span></p>
        <p className="text-gray-600 mb-4">
          This part of the site is still under construction — but don't worry, we're here to help if you need support right away.<br /><br />
          <span className="block my-2">📞 <span className="font-semibold">Call us at 0977 11 88880</span> to schedule assistance.</span>
          <span className="block my-2">🕒 <span className="font-semibold">Support Hours:</span> 8:00 AM – 4:00 PM</span>
          <span className="block my-2">If you reach out before <span className="font-semibold">10:00 AM</span>, we'll do our best to fit you in the same afternoon, depending on our current queue.</span>
          <span className="block my-2">We aim to resolve all issues within <span className="font-semibold">48 hours</span>.</span>
        </p>
        <p className="text-gray-500 italic">Thanks for your patience and understanding!</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span role="img" aria-label="printer" className="mr-2">🖨️</span>
          Common Details Needed for Printer Issue Reports
        </h4>
        <p className="text-gray-600 mb-4">
          To help us assist you faster and more efficiently, please provide the following details when reporting a printer issue:
        </p>
        
        <div className="space-y-4">
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Error Message (if any)</h5>
            <p className="text-sm text-gray-600">Exact wording or a screenshot of the message displayed.</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Printer Model</h5>
            <p className="text-sm text-gray-600">Example: HP LaserJet Pro M404dn</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Serial Number or Asset Tag</h5>
            <p className="text-sm text-gray-600">Found on a sticker on the back or bottom of the printer.</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Issue Description</h5>
            <p className="text-sm text-gray-600">What's happening? (e.g., paper jam, not printing, blank pages)</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">When Did the Issue Start?</h5>
            <p className="text-sm text-gray-600">Approximate date and time the issue began.</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Steps Already Taken</h5>
            <p className="text-sm text-gray-600">Any troubleshooting you've tried (e.g., restarted printer, replaced toner, checked cables)</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Connection Type</h5>
            <p className="text-sm text-gray-600">USB / Network / Wi-Fi</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Printer Location</h5>
            <p className="text-sm text-gray-600">Office name, floor, or room number to help us locate the unit.</p>
          </div>
          
          <div>
            <h5 className="font-semibold text-gray-900 mb-1">Contact Person</h5>
            <p className="text-sm text-gray-600">Name and number of the person we can contact for further details.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 