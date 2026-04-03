import React from 'react';
import { Info, Code, User, Users, GraduationCap, Server } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function About() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-12 px-4 sm:px-6 lg:px-8 relative animate-fade-in-up overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[600px] h-[90vw] max-h-[600px] bg-primary/10 blur-[80px] md:blur-[150px] rounded-full pointer-events-none"></div>

      <div className="w-full max-w-3xl glass p-6 md:p-10 rounded-3xl shadow-2xl relative z-10 border border-glassBorder/50">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-full mb-4 border border-primary/20">
            <Info className="text-primary w-8 h-8" />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">{t('about.title')}</h1>
          <p className="text-gray-400 font-light text-lg">{t('about.subtitle')}</p>
        </div>

        <div className="space-y-6">
          <div className="flex items-start gap-4 p-5 bg-dark/50 rounded-2xl border border-glassBorder hover:border-primary/30 transition-colors">
            <GraduationCap className="text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{t('about.institution_label')}</h3>
              <p className="text-white text-lg font-medium">{t('about.institution_value')}</p>
              <p className="text-gray-400">{t('about.institution_desc')}</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-primary/5 rounded-2xl border border-primary/20 transition-colors">
            <User className="text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{t('about.advisor_label')}</h3>
              <p className="text-white text-lg font-medium">Dr. Volkan Doğru</p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-secondary/5 rounded-2xl border border-secondary/20 transition-colors">
            <User className="text-secondary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{t('about.leads_label')}</h3>
              <p className="text-white text-lg font-medium leading-tight">
                Melih Kerem Arslan <br />
                Beril Sude Çimenoğlu
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-dark/30 rounded-2xl border border-glassBorder/40 opacity-80 hover:opacity-100 transition-opacity">
            <Users className="text-gray-500 mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">{t('about.team_label')}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                {[
                  'Meryem Ceylin Öz', 'Berzan Davut Tekin', 'Zeynep Naz Kalabalık',
                  'Eren Özeren', 'Ömer Faruk Çoban', 'Enes Karadağ', 'Mustafa İnanç'
                ].map(name => (
                  <p key={name} className="text-gray-400 text-sm whitespace-nowrap">• {name}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-dark/50 rounded-2xl border border-glassBorder hover:border-primary/30 transition-colors">
            <Server className="text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{t('about.stack_label')}</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {['React', 'Node.js', 'Express', 'SQLite', 'Gemini API', 'Socket.io', 'Tailwind CSS'].map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-start gap-4 p-5 bg-dark/50 rounded-2xl border border-glassBorder hover:border-primary/30 transition-colors">
            <Code className="text-primary mt-1 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{t('about.desc_label')}</h3>
              <p className="text-gray-300 leading-relaxed">{t('about.desc_value')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
