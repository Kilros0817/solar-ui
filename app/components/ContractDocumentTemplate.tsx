'use client'

interface ContractDocumentTemplateProps {
  title: string;
  client: string;
  value: string;
  createdDate: string;
}

export function ContractDocumentTemplate({ 
  title, 
  client, 
  value, 
  createdDate 
}: ContractDocumentTemplateProps) {
  return (
    <div className="border rounded-lg p-6 bg-white max-h-[800px] overflow-y-auto">
      {/* Document Header */}
      <div className="text-center mb-8 pb-6 border-b">
        <h2 className="text-2xl font-bold mb-2">{title}</h2>
        <p className="text-muted-foreground">{client}</p>
        <p className="text-sm text-muted-foreground mt-2">Effective Date: {createdDate}</p>
      </div>

      {/* Section 1: Terms & Conditions */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">1. Terms & Conditions</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            This Software License Agreement ("Agreement") is entered into between {client} ("Licensee") 
            and the software provider ("Licensor") effective as of the date of execution.
          </p>
          <p>
            The Licensor grants to the Licensee a non-exclusive, non-transferable license to use the Software 
            in accordance with the terms and conditions set forth herein. This license is subject to the payment 
            of all fees and compliance with all terms of this Agreement.
          </p>
          <p>
            The Licensee agrees to use the Software solely for its internal business purposes and shall not 
            sublicense, distribute, or otherwise make the Software available to any third party without the 
            prior written consent of the Licensor.
          </p>
        </div>
      </div>

      {/* Section 2: Pricing & Payment Terms */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">2. Pricing & Payment Terms</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            The total contract value for this agreement is <strong>{value}</strong>, payable according 
            to the following schedule:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Initial payment of 50% due upon execution of this Agreement</li>
            <li>Remaining balance of 50% due upon completion of implementation</li>
          </ul>
          <p>
            All payments shall be made within thirty (30) days of invoice date. Late payments may incur 
            interest charges of 1.5% per month on the outstanding balance.
          </p>
          <p>
            The Licensee acknowledges that all fees are non-refundable except as expressly provided in 
            Section 8 (Termination) of this Agreement.
          </p>
        </div>
      </div>

      {/* Section 3: Service Level Agreement */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">3. Service Level Agreement</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            The Licensor commits to maintaining the Software with an uptime availability of 99.9% measured 
            on a monthly basis, excluding scheduled maintenance windows.
          </p>
          <p>
            Support services will be provided during standard business hours (9:00 AM - 6:00 PM EST, Monday 
            through Friday). Premium support options are available for extended hours and priority response times.
          </p>
          <p>
            The Licensor will provide regular updates and patches to the Software as part of the standard 
            maintenance included in this Agreement. Major version upgrades may be subject to additional fees.
          </p>
        </div>
      </div>

      {/* Section 4: Data Retention & Privacy */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">4. Data Retention & Privacy</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            The Licensor will retain Licensee data in accordance with applicable data protection laws and 
            regulations. Data will be retained for a minimum period of seven (7) years following the 
            termination of this Agreement.
          </p>
          <p>
            All data processing activities will comply with GDPR, CCPA, and other applicable privacy 
            regulations. The Licensor will implement appropriate technical and organizational measures 
            to ensure data security.
          </p>
          <p>
            The Licensee retains all rights, title, and interest in and to its data. The Licensor 
            shall not use Licensee data for any purpose other than providing the services under this Agreement.
          </p>
        </div>
      </div>

      {/* Section 5: Intellectual Property */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">5. Intellectual Property</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            All intellectual property rights in the Software, including but not limited to copyrights, 
            trademarks, and trade secrets, remain the exclusive property of the Licensor.
          </p>
          <p>
            The Licensee acknowledges that this Agreement does not grant any ownership rights in the Software 
            or any modifications or enhancements thereto. Any customizations or modifications made by the 
            Licensee shall become the property of the Licensor.
          </p>
        </div>
      </div>

      {/* Section 6: Liability & Insurance */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">6. Liability & Insurance</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            The Licensor's total liability under this Agreement shall not exceed the total fees paid by 
            the Licensee in the twelve (12) months preceding the claim.
          </p>
          <p>
            Neither party shall be liable for indirect, incidental, special, or consequential damages, 
            including but not limited to loss of profits, data, or business opportunities.
          </p>
          <p>
            The Licensor maintains professional liability insurance in the amount of $5,000,000 and will 
            provide proof of insurance upon request.
          </p>
        </div>
      </div>

      {/* Section 7: Termination */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">7. Termination</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            Either party may terminate this Agreement upon thirty (30) days written notice. The Licensor 
            may terminate immediately in the event of a material breach by the Licensee.
          </p>
          <p>
            Upon termination, the Licensee's right to use the Software shall immediately cease. The Licensee 
            may request a data export within thirty (30) days of termination.
          </p>
          <p>
            Sections 5 (Intellectual Property), 6 (Liability), and 8 (Governing Law) shall survive termination 
            of this Agreement.
          </p>
        </div>
      </div>

      {/* Section 8: Governing Law */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold mb-4">8. Governing Law</h3>
        <div className="space-y-3 text-sm leading-relaxed">
          <p>
            This Agreement shall be governed by and construed in accordance with the laws of the State of 
            Delaware, without regard to its conflict of law provisions.
          </p>
          <p>
            Any disputes arising out of or relating to this Agreement shall be resolved through binding 
            arbitration in accordance with the rules of the American Arbitration Association.
          </p>
        </div>
      </div>

      {/* Signature Section */}
      <div className="mt-12 pt-8 border-t">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <p className="font-semibold mb-2">Licensor</p>
            <div className="border-b-2 border-gray-400 mb-2 h-12"></div>
            <p className="text-xs text-muted-foreground">Signature</p>
            <div className="mt-4 border-b border-gray-300 mb-2"></div>
            <p className="text-xs text-muted-foreground">Name & Title</p>
            <div className="mt-4 border-b border-gray-300 mb-2"></div>
            <p className="text-xs text-muted-foreground">Date</p>
          </div>
          <div>
            <p className="font-semibold mb-2">Licensee</p>
            <div className="border-b-2 border-gray-400 mb-2 h-12"></div>
            <p className="text-xs text-muted-foreground">Signature</p>
            <div className="mt-4 border-b border-gray-300 mb-2"></div>
            <p className="text-xs text-muted-foreground">Name & Title</p>
            <div className="mt-4 border-b border-gray-300 mb-2"></div>
            <p className="text-xs text-muted-foreground">Date</p>
          </div>
        </div>
      </div>
    </div>
  );
}

