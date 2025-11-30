import React from "react";
import { Facebook, Instagram, Mail, MessageCircle } from "lucide-react";
import { useCompanyBranding } from "@/hooks/use-company-branding";

export default function LoginFooter() {
  const { branding } = useCompanyBranding();
  return (
    <div className="mt-4 text-center">
      <div className="flex items-center justify-center gap-4">
        {/* Powered by */}
        <div className="flex items-center text-xs text-gray-500 mr-4">
          Powered by{" "}
          <a
            href="https://maptechnepal.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors ml-1"
          >
            <img
              src={branding.mapLogo}
              alt="MapTech Nepal"
              className="h-3 w-auto inline"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/company__logo.webp";
              }}
            />
          </a>
        </div>

        {/* Social icons */}
        <a
          href="mailto:support@maptechnepal.com"
          className="p-1 text-red-500 hover:text-red-600 transition-colors"
          title="Email"
        >
          <Mail className="w-4 h-4" />
        </a>
        <a
          href="https://wa.me/9779745673009"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-green-500 hover:text-green-600 transition-colors"
          title="WhatsApp"
        >
          <MessageCircle className="w-4 h-4" />
        </a>
        <a
          href="https://www.facebook.com/maptech.np/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-blue-600 hover:text-blue-700 transition-colors"
          title="Facebook"
        >
          <Facebook className="w-4 h-4" />
        </a>
        <a
          href="https://www.instagram.com/maptech.np/"
          target="_blank"
          rel="noopener noreferrer"
          className="p-1 text-pink-500 hover:text-pink-600 transition-colors"
          title="Instagram"
        >
          <Instagram className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
