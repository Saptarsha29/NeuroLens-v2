import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Home() {
  const { currentUser } = useAuth()

  return (
    <div className="h-screen w-full bg-white text-slate-900 relative overflow-hidden flex flex-col font-sans">
      
      {/* 3D DNA & ABSTRACT PURPLE RIGHT-SIDE GRAPHIC */}
      <div className="absolute right-0 top-0 bottom-0 w-full lg:w-[60%] pointer-events-none overflow-hidden z-0">
         <div className="absolute right-[-10%] top-[10%] w-[600px] h-[800px] bg-purple-500/20 blur-[120px] rounded-full mix-blend-multiply opacity-70 animate-pulse"></div>
         <div className="absolute right-[10%] top-[40%] w-[400px] h-[600px] bg-indigo-500/20 blur-[100px] rounded-full mix-blend-multiply opacity-60"></div>    





         {/* Simple dotted DNA visual structure mimicking the reference */}
         <div className="absolute inset-0 opacity-40 ml-[30%]" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #8b5cf6 2px, transparent 0)', backgroundSize: '18px 18px', maskImage: 'radial-gradient(ellipse at center, black, transparent 60%)', WebkitMaskImage: 'radial-gradient(ellipse at center, black, transparent 60%)' }}></div>
      </div>

      {/* MAIN TOP SECTION */}
      <div className="flex-1 max-w-[1600px] mx-auto w-full px-6 md:px-12 lg:px-24 z-10 flex flex-col justify-center pt-20">
        <div className="flex flex-col items-start text-left max-w-xl xl:max-w-2xl mt-4">
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-slate-800 mb-6">
            PURPOSE OF NEUROLENS
          </p>

          <h1 className="text-[2.25rem] sm:text-5xl md:text-[4.5rem] leading-[1.05] tracking-tight text-slate-900 mb-8 w-full font-medium pr-4">
            Not just another test. <br />
            Proactive neurological care.
          </h1>

          <p className="text-sm md:text-[15px] text-slate-700 max-w-sm leading-relaxed mb-8 font-medium">
            Health is the most important thing. NeuroLens uses your voice and motor skills to detect early signs of Parkinson's disease � making life-saving neurological screening accessible to everyone, anywhere, anytime.
          </p>

          <div className="flex items-center gap-4 flex-wrap">
            {!currentUser ? (
              <Link to="/tests" className="border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white px-8 py-3.5 rounded-full font-semibold text-xs sm:text-sm tracking-widest transition-all uppercase">
                MAKE AN APPOINTMENT
              </Link>
            ) : (
              <>
                <Link to="/tests" className="border border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white px-8 py-3.5 rounded-full font-semibold text-xs sm:text-sm tracking-widest transition-all uppercase">
                  START SCREENING
                </Link>
                <Link to="/dashboard" className="bg-[#0b0c10] text-white hover:bg-black px-8 py-3.5 rounded-full font-semibold text-xs sm:text-sm tracking-widest transition-all shadow-lg uppercase">
                  MY DASHBOARD
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* BOTTOM CARD BAR */}
      <div className="w-full z-10 px-4 sm:px-8 pb-8 max-w-[1600px] mx-auto shrink-0 mt-auto">
         <div className="bg-gradient-to-r from-slate-50 to-white backdrop-blur-3xl rounded-[2.5rem] p-6 sm:p-10 lg:p-12 border border-slate-200/60 flex flex-col lg:flex-row shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] w-full relative overflow-hidden">

            <div className="lg:w-1/2 flex gap-6 sm:gap-10 lg:gap-16 items-start shrink-0 relative z-10">
               <span className="text-5xl md:text-7xl font-semibold tracking-tighter text-slate-900 leading-[0.8] w-20 md:w-24">01</span>
               <div className="pt-1 md:pt-2">
                  <p className="text-[10px] font-bold text-slate-800 mb-3 md:mb-5 tracking-widest uppercase">2024-08-30</p>
                  <h3 className="text-lg md:text-[1.75rem] font-medium tracking-tight text-slate-900 leading-snug w-full max-w-[280px]">
                     First Central Laboratory in Clinical Research
                  </h3>
               </div>
            </div>

            <div className="lg:w-1/2 mt-6 lg:mt-0 flex items-center lg:pl-10 relative z-10">
               <p className="text-xs sm:text-sm text-slate-600 leading-[1.8] font-medium">
                 NeuroLens is a Global Clinical Research Central Laboratory specializing in Oncology/Cancer Research with accreditations from Institute of American Medics (IAM) and Clinical Laboratory Improvement Amendments (CLIA), has been in operation globally since 2009 and in Europe since June 2021.
               </p>
            </div>
         </div>
      </div>

    </div>
  )
}
