import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';
import { X, Download, FileText, Image as ImageIcon, QrCode, CheckCircle, Copy } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getVenueUrl } from '../utils/domain';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueName: string;
  venueSlug: string;
  customDomain?: string | null;
  customDomainVerified?: boolean | number | null;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  venueName,
  venueSlug,
  customDomain,
  customDomainVerified,
}) => {
  const [svgString, setSvgString] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const { t } = useTranslation();

  const targetUrl = getVenueUrl({
    slug: venueSlug,
    custom_domain: customDomain,
    custom_domain_verified: customDomainVerified,
  });

  useEffect(() => {
    if (isOpen && venueSlug) {
      QRCode.toString(
        targetUrl,
        {
          type: 'svg',
          margin: 2,
          width: 256,
          color: {
            dark: '#1e1b4b', // Deep indigo text color
            light: '#ffffff',
          },
        },
        (err, string) => {
          if (err) {
            console.error('Failed to generate QR code:', err);
            setError(t('could_not_generate_qr'));
          } else {
            setSvgString(string);
          }
        }
      );
    }
  }, [isOpen, venueSlug, targetUrl]);

  if (!isOpen) return null;

  const downloadSvg = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `qr-${venueSlug}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadPng = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 4; // High-res download
      const size = 256 * scale;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const pngUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.href = pngUrl;
        link.download = `qr-${venueSlug}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const downloadPdf = () => {
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = 4;
      const size = 256 * scale;
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const pngData = canvas.toDataURL('image/png');

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4',
        });

        // Add beautiful title & header
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(26);
        pdf.setTextColor(79, 70, 229); // indigo-600
        pdf.text(venueName, 105, 45, { align: 'center' });

        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(14);
        pdf.setTextColor(107, 114, 128); // gray-500
        pdf.text(t('scan_to_view_menu'), 105, 55, { align: 'center' });

        // Add QR code centered
        pdf.addImage(pngData, 'PNG', 45, 75, 120, 120);

        // Divider
        pdf.setDrawColor(229, 231, 235); // gray-200
        pdf.setLineWidth(0.5);
        pdf.line(20, 245, 190, 245);

        // Footer info
        pdf.setFont('helvetica', 'italic');
        pdf.setFontSize(10);
        pdf.setTextColor(156, 163, 175); // gray-400
        pdf.text(t('powered_by_qr_menu'), 105, 255, { align: 'center' });

        pdf.save(`qr-${venueSlug}.pdf`);
      }
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-gray-100 transform transition-all duration-300 scale-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-2">
            <QrCode className="text-indigo-600" size={20} />
            <h3 className="text-lg font-bold text-gray-900">{t('generate_qr_code')}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 flex-grow flex flex-col items-center">
          <div className="text-center w-full">
            <h4 className="font-bold text-gray-800 text-lg truncate max-w-full px-2">{venueName}</h4>
            <p className="text-xs text-indigo-600 font-semibold mt-1 truncate max-w-full px-4">{targetUrl}</p>
          </div>

          {/* QR Display */}
          <div className="relative p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-center w-64 h-64 shadow-inner">
            {error ? (
              <p className="text-red-500 text-sm font-medium">{error}</p>
            ) : svgString ? (
              <div
                className="w-full h-full [&>svg]:w-full [&>svg]:h-full [&>svg]:rounded-lg"
                dangerouslySetInnerHTML={{ __html: svgString }}
              />
            ) : (
              <p className="text-gray-400 text-sm font-medium">{t('generating')}</p>
            )}
          </div>

          {/* Copy URL */}
          <div className="w-full flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl p-2">
            <span className="text-xs text-gray-500 truncate flex-grow pl-1 select-all">{targetUrl}</span>
            <button
              onClick={copyUrl}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                copied
                  ? 'bg-green-600 text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {copied ? (
                <>
                  <CheckCircle size={14} />
                  {t('copied')}
                </>
              ) : (
                <>
                  <Copy size={14} />
                  {t('copy_link')}
                </>
              )}
            </button>
          </div>

          {/* Download Action Buttons */}
          <div className="grid grid-cols-3 gap-3 w-full border-t border-gray-100 pt-5">
            <button
              onClick={downloadSvg}
              disabled={!svgString}
              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-gray-700 hover:text-indigo-600 cursor-pointer disabled:opacity-50"
            >
              <Download size={18} className="mb-1.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">SVG</span>
            </button>

            <button
              onClick={downloadPng}
              disabled={!svgString}
              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-gray-700 hover:text-indigo-600 cursor-pointer disabled:opacity-50"
            >
              <ImageIcon size={18} className="mb-1.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">PNG</span>
            </button>

            <button
              onClick={downloadPdf}
              disabled={!svgString}
              className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:bg-indigo-50/50 hover:border-indigo-200 transition-all text-gray-700 hover:text-indigo-600 cursor-pointer disabled:opacity-50"
            >
              <FileText size={18} className="mb-1.5" />
              <span className="text-[10px] font-black uppercase tracking-wider">PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
