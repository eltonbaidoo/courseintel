"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Check, X, Minus, TriangleAlert, Building2,
  LineChart, FileText, Upload, Edit3, Cpu, Sparkles 
} from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B1120] text-slate-50 font-sans selection:bg-blue-500/30">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-[#0B1120]/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm text-white">
              CI
            </div>
            <span className="font-bold text-lg tracking-tight">CourseIntel</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
            <Link href="#product" className="hover:text-slate-200 transition-colors">Product</Link>
            <Link href="#how-it-works" className="hover:text-slate-200 transition-colors">How It Works</Link>
            <Link href="#features" className="hover:text-slate-200 transition-colors">Features</Link>
            <Link href="#testimonials" className="hover:text-slate-200 transition-colors">Testimonials</Link>
          </div>

          <div>
            <Button variant="base44" className="rounded-full px-5 py-2 font-medium text-sm">
              Get Early Access
            </Button>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="pt-40 pb-20 px-6 max-w-5xl mx-auto text-center relative">
        <div className="inline-block mb-6 relative">
          <div className="absolute inset-0 bg-slate-800/50 blur-xl rounded-full" />
          <span className="relative z-10 text-xs font-mono font-medium tracking-wider text-slate-400 bg-slate-900/50 border border-slate-800 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Early access now open
          </span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] mb-8">
          <span className="text-slate-50 block">Understand your course.</span>
          <span className="text-blue-500 block">Predict your outcome.</span>
          <span className="text-[#a3b65c] block">Know what to do next.</span>
        </h1>

        <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-400 leading-relaxed mb-10">
          CourseIntel turns scattered syllabi, grades, and deadlines into a live course intelligence system — so you always know where you stand and what to prioritize.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <Button variant="base44" className="rounded-full px-8 h-12 text-base w-full sm:w-auto">
            Get Early Access <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
          <Button variant="base44-ghost" className="h-12 text-base px-2">
            See How It Works <span className="ml-1 opacity-50">▾</span>
          </Button>
        </div>

        {/* Hero Mockup */}
        <div className="mt-20 mx-auto max-w-3xl border border-slate-800 bg-[#0F172A] rounded-2xl p-6 md:p-8 text-left shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-6">
             <div className="bg-slate-800/50 text-slate-300 font-mono font-semibold text-lg py-3 px-4 rounded-xl">
               A-
             </div>
           </div>

           <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-2">COURSE PROFILE</div>
           <div className="text-xl md:text-2xl font-semibold text-slate-100 mb-8">CS 301 — Data Structures</div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#1E293B] border border-slate-700/50 rounded-xl p-6">
                 <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-1">CURRENT GRADE</div>
                 <div className="text-4xl font-bold text-slate-50">87.3<span className="text-xl text-slate-400 font-medium ml-1">%</span></div>
              </div>
              <div className="bg-[#1E293B] border border-slate-700/50 rounded-xl p-6">
                 <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-1">PASS PROBABILITY</div>
                 <div className="text-4xl font-bold text-[#a3b65c]">94.2<span className="text-xl text-[#a3b65c]/70 font-medium ml-1">%</span></div>
              </div>
           </div>

           <div className="mt-6 mb-2 text-xs font-mono tracking-widest text-slate-500 uppercase">GRADING BREAKDOWN</div>
           <div className="flex h-3 rounded-full overflow-hidden w-full bg-slate-800 gap-1">
              <div className="bg-blue-500" style={{ width: '35%' }} />
              <div className="bg-blue-400" style={{ width: '25%' }} />
              <div className="bg-[#a3b65c]" style={{ width: '20%' }} />
              <div className="bg-emerald-600" style={{ width: '15%' }} />
              <div className="bg-slate-600" style={{ width: '5%' }} />
           </div>
           <div className="flex justify-between text-[10px] text-slate-500 mt-2 font-mono">
              <span>Exams 35%</span>
              <span>Labs 25%</span>
              <span>HW 20%</span>
              <span>Project 15%</span>
           </div>

           <div className="mt-8 mb-4 text-xs font-mono tracking-widest text-slate-500 uppercase">THIS WEEK&apos;S PRIORITIES</div>
           <div className="space-y-3">
              <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-slate-200 text-sm font-medium">Midterm Exam — Thursday</span>
                 </div>
                 <span className="text-red-400 font-mono text-xs font-medium">HIGH</span>
              </div>
              <div className="flex items-center justify-between bg-slate-800/40 border border-slate-700/50 p-3 rounded-lg">
                 <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="text-slate-200 text-sm font-medium">Lab 5 Due — Wednesday</span>
                 </div>
                 <span className="text-slate-400 font-mono text-xs">MED</span>
              </div>
           </div>

           <div className="mt-4 text-xs font-mono text-slate-500">
             • 3 deadlines detected from syllabus
           </div>
        </div>
      </section>

      {/* ── Problem Section ── */}
      <section id="problem" className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-800/50">
        <div className="text-center mb-16">
          <div className="text-xs font-mono text-blue-500 tracking-widest uppercase mb-4">THE PROBLEM</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50 mb-4">
            Academic data is<br />everywhere. <div className="text-slate-500 inline">Clarity is nowhere.</div>
          </h2>
          <p className="text-slate-400 text-lg max-w-2xl mx-auto">
            Students spend more time figuring out how courses work than actually learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 */}
          <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 mb-6">
              <TriangleAlert className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Deadlines scattered everywhere</h3>
            <p className="text-slate-400 leading-relaxed">
              Canvas, email, PDFs, Slack — your deadlines live in six places and none of them talk to each other.
            </p>
          </div>
          {/* Card 2 */}
          <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300 mb-6">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Syllabi are unreadable contracts</h3>
            <p className="text-slate-400 leading-relaxed">
              Dense, inconsistent, and buried in policy language. The information you need is there — just impossible to extract.
            </p>
          </div>
          {/* Card 3 */}
          <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#a3b65c]/10 flex items-center justify-center text-[#a3b65c] mb-6">
              <LineChart className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Grades are black boxes</h3>
            <p className="text-slate-400 leading-relaxed">
              Weighted categories, curved scores, dropped lowest — you can&apos;t calculate your standing without a spreadsheet.
            </p>
          </div>
          {/* Card 4 */}
          <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-6">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-100 mb-3">Notes disconnected from context</h3>
            <p className="text-slate-400 leading-relaxed">
              You study hard, but without knowing what&apos;s high-stakes this week, effort gets spread thin.
            </p>
          </div>
        </div>
      </section>

      {/* ── How It Works Section ── */}
      <section id="how-it-works" className="py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <div className="text-xs font-mono text-blue-500 tracking-widest uppercase mb-4">HOW IT WORKS</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50">
            From chaos to clarity<br />
            <span className="text-slate-500">in four steps.</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl relative overflow-hidden group">
            <div className="text-6xl font-black text-slate-800/30 absolute top-4 right-4 pointer-events-none">01</div>
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-12">
               <Upload className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-3">Enter your course</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Add your course details and upload your syllabus. PDF, DOCX, or paste the text — CourseIntel handles it all.
            </p>
          </div>
          <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl relative overflow-hidden">
            <div className="text-6xl font-black text-slate-800/30 absolute top-4 right-4 pointer-events-none">02</div>
            <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 mb-12">
               <Edit3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-3">Add your data</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Input grades, study materials, and notes as they come in. The model gets smarter with every update.
            </p>
          </div>
          <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl relative overflow-hidden">
             <div className="text-6xl font-black text-slate-800/30 absolute top-4 right-4 pointer-events-none">03</div>
             <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mb-12">
               <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-3">Intelligence builds</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              CourseIntel constructs a live model of your course — grading logic, deadlines, priorities, risk factors.
            </p>
          </div>
          <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl relative overflow-hidden">
             <div className="text-6xl font-black text-slate-800/30 absolute top-4 right-4 pointer-events-none">04</div>
             <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-12">
               <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-3">Get clear answers</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Receive grade predictions, action plans, risk alerts, and study context — updated as your semester evolves.
            </p>
          </div>
        </div>
      </section>

      {/* ── Command Center Section ── */}
      <section id="features" className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-800/50">
        <div className="text-center mb-16">
          <div className="text-xs font-mono text-blue-500 tracking-widest uppercase mb-4">COMMAND CENTER</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50 mb-4">
            Your entire semester.<br />
            <span className="text-blue-500">One dashboard.</span>
          </h2>
        </div>

        <div className="border border-slate-800 bg-[#121A2A] rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden flex flex-col md:flex-row gap-6">
           <div className="flex-1 flex flex-col gap-6">
              
              {/* Box 1 */}
              <div className="bg-[#1E293B]/50 border border-slate-700/50 rounded-2xl p-6">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-1">CURRENT STANDING</div>
                       <div className="text-2xl font-bold text-slate-100">CS 301 — Data Structures</div>
                    </div>
                    <div className="text-right">
                       <div className="text-3xl font-bold text-slate-50">B+</div>
                       <div className="text-sm text-slate-400 font-mono">87.3%</div>
                    </div>
                 </div>
                 
                 <div className="flex justify-between text-xs text-slate-400 mb-2 font-medium">
                    <span>Progress toward target (A-)</span>
                    <span className="font-mono">87.3 / 90.0</span>
                 </div>
                 <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden relative mb-2">
                    <div className="absolute inset-y-0 left-0 bg-blue-500 rounded-full" style={{ width: '87.3%' }}></div>
                 </div>
                 <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>C (70%)</span>
                    <span>B (80%)</span>
                    <span>A- (90%)</span>
                    <span>A (93%)</span>
                 </div>
              </div>

              {/* Box 2 */}
              <div className="bg-[#1E293B]/50 border border-slate-700/50 rounded-2xl p-6">
                 <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-4">UPCOMING ASSIGNMENTS</div>
                 <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                       <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                          <span className="text-slate-200 font-medium">Midterm Exam</span>
                       </div>
                       <div className="text-slate-400 text-sm font-mono flex gap-4">
                          <span>25%</span>
                          <span>Mar 28</span>
                       </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                       <div className="flex items-center gap-3">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                          <span className="text-slate-200 font-medium">Lab 5: Binary Trees</span>
                       </div>
                       <div className="text-slate-400 text-sm font-mono flex gap-4">
                          <span>5%</span>
                          <span>Mar 26</span>
                       </div>
                    </div>
                 </div>
              </div>
           </div>

           <div className="flex-1 flex flex-col gap-6">
               
              {/* Risk Alert */}
              <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6">
                 <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-xs font-mono tracking-widest text-red-500 uppercase">RISK ALERT</span>
                 </div>
                 <h4 className="text-lg font-bold text-slate-100 mb-2">Midterm worth 25% of grade</h4>
                 <p className="text-sm text-slate-400 leading-relaxed">
                    Scoring below 78% drops you to a B. Review Chapters 5-8 priority.
                 </p>
              </div>

              {/* Study Recommendations */}
              <div className="bg-[#1E293B]/50 border border-slate-700/50 rounded-2xl p-6">
                 <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-4">STUDY RECOMMENDATIONS</div>
                 <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                       <span className="text-slate-300 text-sm leading-relaxed">Review BST traversals</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                       <span className="text-slate-300 text-sm leading-relaxed">Practice hash table problems</span>
                    </li>
                    <li className="flex items-start gap-3">
                       <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
                       <span className="text-slate-300 text-sm leading-relaxed">Re-read Ch. 7 graph algorithms</span>
                    </li>
                 </ul>
              </div>

              {/* Confidence */}
              <div className="bg-[#1E293B]/50 border border-slate-700/50 rounded-2xl p-6">
                 <div className="text-xs font-mono tracking-widest text-slate-500 uppercase mb-4">CONFIDENCE SCORE</div>
                 <div className="text-4xl font-bold text-blue-400 mb-2">92 <span className="text-xl text-slate-500">/ 100</span></div>
                 <p className="text-xs text-slate-500 font-mono">Based on 14 data points from syllabus + 8 graded items</p>
              </div>

           </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="py-24 px-6 max-w-5xl mx-auto border-t border-slate-800/50">
        <div className="text-center mb-16">
          <div className="text-xs font-mono text-blue-500 tracking-widest uppercase mb-4">WHY IT&apos;S DIFFERENT</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50">
            Not another planner.<br />
            <span className="text-slate-500">An intelligence system.</span>
          </h2>
          <p className="text-slate-400 text-lg mt-6">
             Planners organize dates. LMS platforms host content. CourseIntel understands your course.
          </p>
        </div>

        <div className="bg-[#121A2A] border border-slate-800 rounded-2xl overflow-x-auto">
           <table className="w-full min-w-[800px] text-sm text-left border-collapse">
             <thead>
               <tr className="border-b border-slate-800">
                 <th className="py-6 px-6 font-medium text-slate-400 w-1/3">Capability</th>
                 <th className="py-6 px-6 font-bold text-blue-500 text-center">CourseIntel</th>
                 <th className="py-6 px-6 font-medium text-slate-500 text-center">Calendar Tools</th>
                 <th className="py-6 px-6 font-medium text-slate-500 text-center">LMS Platforms</th>
                 <th className="py-6 px-6 font-medium text-slate-500 text-center">Note Apps</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-slate-800 border-b border-slate-800">
               <tr>
                 <td className="py-5 px-6 text-slate-300">Syllabus parsing & structure extraction</td>
                 <td className="py-5 px-6 text-center text-blue-500"><Check className="w-5 h-5 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
               </tr>
               <tr>
                 <td className="py-5 px-6 text-slate-300">Weighted grade calculation & forecast</td>
                 <td className="py-5 px-6 text-center text-blue-500"><Check className="w-5 h-5 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><Minus className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
               </tr>
               <tr>
                 <td className="py-5 px-6 text-slate-300">Academic risk detection</td>
                 <td className="py-5 px-6 text-center text-blue-500"><Check className="w-5 h-5 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
               </tr>
               <tr>
                 <td className="py-5 px-6 text-slate-300">Weekly action plans by grade impact</td>
                 <td className="py-5 px-6 text-center text-blue-500"><Check className="w-5 h-5 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
               </tr>
               <tr>
                 <td className="py-5 px-6 text-slate-300">Deadline discovery from documents</td>
                 <td className="py-5 px-6 text-center text-blue-500"><Check className="w-5 h-5 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><Minus className="w-4 h-4 mx-auto" /></td>
                 <td className="py-5 px-6 text-center text-slate-600"><X className="w-4 h-4 mx-auto" /></td>
               </tr>
             </tbody>
           </table>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-24 px-6 max-w-6xl mx-auto border-t border-slate-800/50">
        <div className="text-center mb-16">
          <div className="text-xs font-mono text-blue-500 tracking-widest uppercase mb-4">TESTIMONIALS</div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-slate-50">
            Students don&apos;t guess<br />anymore.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
           <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl flex flex-col justify-between">
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                 &quot;I was manually tracking my grade in a spreadsheet every week. CourseIntel replaced that entirely — and it tells me things I didn&apos;t even think to calculate.&quot;
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white">S</div>
                 <div>
                    <div className="font-bold text-slate-100">Sarah K.</div>
                    <div className="text-sm text-slate-500">Junior, Computer Science · Georgia Tech</div>
                 </div>
              </div>
           </div>
           
           <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl flex flex-col justify-between">
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                 &quot;The risk alert literally saved my semester. I didn&apos;t realize my lab average was dragging me below a B until CourseIntel flagged it with two weeks left to fix it.&quot;
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-white">M</div>
                 <div>
                    <div className="font-bold text-slate-100">Marcus T.</div>
                    <div className="text-sm text-slate-500">Senior, Mechanical Engineering · UC Berkeley</div>
                 </div>
              </div>
           </div>

           <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl flex flex-col justify-between">
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                 &quot;I upload my syllabus and within minutes I have a complete model of how the course works. The weekly action plan alone is worth it.&quot;
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-[#a3b65c] flex items-center justify-center font-bold text-white">P</div>
                 <div>
                    <div className="font-bold text-slate-100">Priya M.</div>
                    <div className="text-sm text-slate-500">Sophomore, Biology · Cornell</div>
                 </div>
              </div>
           </div>

           <div className="bg-[#121A2A] border border-slate-800 p-8 rounded-2xl flex flex-col justify-between">
              <p className="text-slate-300 text-lg leading-relaxed mb-8">
                 &quot;My professors don&apos;t make grading transparent. CourseIntel does. I finally know exactly what I need on the final to keep my GPA.&quot;
              </p>
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 rounded-full bg-blue-800 flex items-center justify-center font-bold text-white">J</div>
                 <div>
                    <div className="font-bold text-slate-100">Jordan W.</div>
                    <div className="text-sm text-slate-500">Junior, Economics · Stanford</div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-32 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-b from-[#1E293B]/50 to-transparent border border-slate-800 rounded-[2.5rem] p-12 md:p-24 text-center">
           <h2 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-50 mb-6">
             Stop guessing.<br />
             <span className="text-blue-500">Start knowing.</span>
           </h2>
           <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto mb-10">
             Join thousands of students using CourseIntel to take control of their academic outcomes. Early access is open now.
           </p>
           <Button variant="base44" className="rounded-full px-10 h-14 text-lg">
             Join the Waitlist <ArrowRight className="ml-2 w-5 h-5" />
           </Button>
           <p className="text-slate-500 font-mono text-sm mt-6">
             Free during early access. No credit card required.
           </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-800/80 bg-[#0B1120] py-16 px-6">
         <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-5 gap-12">
            <div className="md:col-span-2">
               <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-sm text-white">CI</div>
                  <span className="font-bold text-lg text-slate-50">CourseIntel</span>
               </div>
               <p className="text-slate-400 max-w-xs">
                 The academic intelligence engine for college students.
               </p>
            </div>
            
            <div>
               <h4 className="font-bold text-slate-100 mb-6">Product</h4>
               <ul className="space-y-4 text-slate-400 text-sm">
                 <li><Link href="#" className="hover:text-blue-400">Features</Link></li>
                 <li><Link href="#" className="hover:text-blue-400">How It Works</Link></li>
                 <li><Link href="#" className="hover:text-blue-400">Pricing</Link></li>
                 <li><Link href="#" className="hover:text-blue-400">Changelog</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-slate-100 mb-6">Company</h4>
               <ul className="space-y-4 text-slate-400 text-sm">
                 <li><Link href="#" className="hover:text-blue-400">About</Link></li>
                 <li><Link href="#" className="hover:text-blue-400">Blog</Link></li>
                 <li><Link href="#" className="hover:text-blue-400">Careers</Link></li>
                 <li><Link href="#" className="hover:text-blue-400">Contact</Link></li>
               </ul>
            </div>

            <div>
               <h4 className="font-bold text-slate-100 mb-6">Legal</h4>
               <ul className="space-y-4 text-slate-400 text-sm">
                 <li><Link href="#" className="hover:text-blue-400">Privacy Policy</Link></li>
                 <li><Link href="#" className="hover:text-blue-400">Terms of Service</Link></li>
                 <li><Link href="#" className="hover:text-blue-400">Cookie Policy</Link></li>
               </ul>
            </div>
         </div>
      </footer>
    </main>
  );
}
