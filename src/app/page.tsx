'use client';

import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useAppState, type Task, type Habit, type Category, type NavSection, type Settings, type SmokeStats } from '@/hooks/useAppState';
import { WeeklyProgressChart, CategoryBreakdownChart, StreakRanking, CompletionDonut } from '@/components/AnalyticsCharts';
import { AdvancedTaskForm } from '@/components/AdvancedTaskForm';
import AISummaryCard from '@/components/AISummaryCard';
import GamificationPanel from '@/components/GamificationPanel';
import HabitManagementPanel from '@/components/HabitManagementPanel';
import NotificationCenter from '@/components/NotificationCenter';
import { exportTasksToCSV, exportHabitsToCSV, exportAllDataToCSV, exportDataToPDF, getWeeklyProgressData, getCategoryBreakdown, getStreakHistory, getCompletionStats } from '@/utils/exportUtils';
import { getPriorityColor, getPriorityLabel, sortTasksByPriority, expandRecurringInTaskList, toggleSubtask, addSubtask, removeSubtask, getSubtaskProgress, logTime, getTimeStats, formatTime, getTimeColor } from '@/utils/taskUtils';
import { calculateDailyPoints, checkAchievements, BADGES, type Achievement } from '@/utils/gamificationUtils';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';


const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CATEGORY_LABELS: Record<Category, string> = { body: 'Body', mind: 'Mind', work: 'Work', quit: 'Quit', fun: 'Fun' };

const NAV_ITEMS = [
  { id: 'dashboard' as NavSection, icon: '⬡', label: 'Dashboard' },
  { id: 'tasks' as NavSection, icon: '◈', label: 'Tasks' },
  { id: 'habits' as NavSection, icon: '◎', label: 'Habits' },
  { id: 'stats' as NavSection, icon: '◫', label: 'Statistics' },
  { id: 'planner' as NavSection, icon: '▦', label: 'Planner' },
  { id: 'analytics' as NavSection, icon: '📊', label: 'Analytics' },
  { id: 'german' as NavSection, icon: '🇩🇪', label: 'German' },
  { id: 'cyber' as NavSection, icon: '🔐', label: 'Cyber' },
  { id: 'settings' as NavSection, icon: '⚙', label: 'Settings' },
];

const GERMAN_ROADMAP = [
  {
    month: 1, phase: 'Foundation', level: 'A1',
    title: 'First Steps',
    grammar: ['German alphabet & pronunciation (ä, ö, ü, ß)', 'Nouns & grammatical gender (der, die, das)', 'Personal pronouns (ich, du, er, sie, wir...)', 'Present tense: sein & haben', 'Basic word order: Subject–Verb–Object', 'Numbers 1–100'],
    vocabulary: ['Greetings and farewells', 'Days of the week & months', 'Colors and numbers', 'Family members', 'Common objects at home'],
    targetWords: 300,
    resources: [
      { name: 'DW Nicos Weg Ep. 1–10', url: 'https://learngerman.dw.com/en/nicos-weg/s-56198270', type: 'video' },
      { name: 'Deutsch für Euch: Gender & Pronouns', url: 'https://youtube.com/@DeutschFuerEuch', type: 'video' },
      { name: 'Coffee Break German Ep. 1–8', url: 'https://coffeebreaklanguages.com/coffeebreakgerman', type: 'podcast' },
      { name: 'Anki: German Top 500 Words', url: 'https://ankiweb.net/shared/decks', type: 'flashcard' },
      { name: 'Duolingo German Basics', url: 'https://duolingo.com', type: 'app' },
    ],
    dailyTasks: ['15 min Anki flashcard review', '20 min DW Nicos Weg episode', '15 min Coffee Break German podcast', '10 min shadowing: repeat phrases out loud'],
    checkpoint: ['Introduce yourself in 5–6 sentences', 'Know 300+ words', 'Recognize all German sounds'],
  },
  {
    month: 2, phase: 'Foundation', level: 'A1',
    title: 'Basic Grammar',
    grammar: ['Nominative and Accusative cases', 'Definite & indefinite articles (der/die/das, ein/eine)', 'Plural forms of nouns (8 patterns)', 'Regular & irregular present tense verbs', 'Modal verbs: können, wollen, müssen', 'Negation with nicht and kein'],
    vocabulary: ['Food and drink', 'Shopping and prices', 'Body parts', 'Adjectives: big, small, good, bad', 'Common verbs: eat, drink, go, come, buy'],
    targetWords: 600,
    resources: [
      { name: 'Deutsch für Euch: Cases Playlist', url: 'https://youtube.com/@DeutschFuerEuch', type: 'video' },
      { name: 'DW Nicos Weg Ep. 11–25', url: 'https://learngerman.dw.com', type: 'video' },
      { name: 'Schubert-Verlag A1 Worksheets', url: 'https://schubert-verlag.de', type: 'worksheet' },
      { name: 'Slow German Podcast Ep. 1–5', url: 'https://slowgerman.com', type: 'podcast' },
    ],
    dailyTasks: ['15 min Anki review', '20 min Nicos Weg episode', '15 min modal verbs practice', '10 min write shopping dialogue'],
    checkpoint: ['Order food and shop in German', 'Understand nominative & accusative cases', 'Know 600+ words'],
  },
  {
    month: 3, phase: 'Foundation', level: 'A1',
    title: 'Sentences Take Shape',
    grammar: ['Dative case (geben, helfen, gefallen)', 'Common prepositions + case (in, auf, mit, von, zu)', 'Separable verbs (aufmachen, anrufen)', 'Present progressive (gerade)', 'Possessive pronouns (mein, dein, sein)', 'Time expressions: heute, morgen, gestern'],
    vocabulary: ['Transportation and directions', 'Weather and seasons', 'Home and rooms', 'Hobbies and free time', 'Telling time'],
    targetWords: 1000,
    resources: [
      { name: 'Deutsch Akademie Free Exercises', url: 'https://deutschakademie.de/online-deutschkurs', type: 'exercise' },
      { name: 'Easy German: Basic Phrases', url: 'https://youtube.com/@EasyGerman', type: 'video' },
      { name: 'Radio D Season 1 (DW)', url: 'https://learngerman.dw.com/en/radio-d/s-57176312', type: 'podcast' },
      { name: 'Tandem Language Exchange', url: 'https://tandem.net', type: 'speaking' },
    ],
    dailyTasks: ['15 min Anki review', '20 min Easy German video', '15 min Deutsch Akademie exercises', '10 min write daily routine paragraph'],
    checkpoint: ['Describe daily routine and home', 'Know all 3 cases (nom, acc, dat)', 'Know ~1,000 words', 'Score 70%+ on mock A1 test'],
  },
  {
    month: 4, phase: 'Building', level: 'A2',
    title: 'Expanding Grammar',
    grammar: ['Genitive case (basics)', 'Two-way prepositions: accusative vs. dative', 'Comparative & superlative adjectives', 'Past tense: Perfekt with haben & sein', 'Common irregular Perfekt forms', 'Konjunktiv II: würde + infinitive'],
    vocabulary: ['Work and professions', 'Education and school', 'Health and body', 'Emotions and feelings', 'City life and places'],
    targetWords: 1400,
    resources: [
      { name: 'Learn German with Anja: Perfekt', url: 'https://youtube.com/@LearnGermanWithAnja', type: 'video' },
      { name: 'Comprehensible German A2', url: 'https://youtube.com/@ComprehensibleGerman', type: 'video' },
      { name: 'Slow German Ep. 10–20', url: 'https://slowgerman.com', type: 'podcast' },
      { name: 'Deutsch Akademie: Perfekt Exercises', url: 'https://deutschakademie.de', type: 'exercise' },
    ],
    dailyTasks: ['15 min Anki review', '20 min Perfekt tense video', '15 min Comprehensible German A2', '10 min write diary entry in Perfekt'],
    checkpoint: ['Talk about past events in conversation', 'Know 1,400+ words', 'Understand two-way prepositions'],
  },
  {
    month: 5, phase: 'Building', level: 'A2',
    title: 'Real Conversations',
    grammar: ['Simple past (Präteritum) for haben, sein, modals', 'Future tense with werden', 'Reflexive verbs (sich waschen, sich freuen)', 'Relative clauses (Der Mann, der...)', 'Subordinating conjunctions: weil, dass, obwohl, wenn', 'Word order with subordinating conjunctions'],
    vocabulary: ['Travel and holidays', 'Technology and internet', 'Media and entertainment', 'Nature and environment', 'Money and banking'],
    targetWords: 1800,
    resources: [
      { name: 'Deutsch für Euch: Conjunctions', url: 'https://youtube.com/@DeutschFuerEuch', type: 'video' },
      { name: 'Easy German: No EN Subtitles', url: 'https://youtube.com/@EasyGerman', type: 'video' },
      { name: 'Coffee Break German S2 Ep. 1–8', url: 'https://coffeebreaklanguages.com', type: 'podcast' },
      { name: 'italki Language Partner', url: 'https://italki.com', type: 'speaking' },
    ],
    dailyTasks: ['15 min Anki review', '20 min conjunction practice', '15 min Easy German without subtitles', '10 min speaking with language partner'],
    checkpoint: ['Construct complex sentences with conjunctions', 'Talk about travel and future plans', 'Know ~1,800 words'],
  },
  {
    month: 6, phase: 'Building', level: 'A2',
    title: 'A2 Consolidation',
    grammar: ['Adjective endings in all four cases', 'Infinitive constructions: um...zu, ohne...zu', 'Passive voice basics: Das Buch wird gelesen', 'Da-compounds (damit, dafür, darauf)', 'Full A2 grammar review'],
    vocabulary: ['Food culture and restaurants', 'Political and social basics', 'Sports', 'Science and learning', 'Top 50 German idioms'],
    targetWords: 2200,
    resources: [
      { name: 'DW Langsam Gesprochene Nachrichten', url: 'https://learngerman.dw.com', type: 'podcast' },
      { name: 'Goethe Institut A2 Sample Tests', url: 'https://goethe.de', type: 'exam' },
      { name: 'Comprehensible German A2–B1', url: 'https://youtube.com/@ComprehensibleGerman', type: 'video' },
      { name: 'German Frequency List 1000–2000', url: 'https://ankiweb.net/shared/decks', type: 'flashcard' },
    ],
    dailyTasks: ['15 min Anki review', '20 min adjective endings practice', '20 min DW slow news podcast', '10 min write 200-word essay'],
    checkpoint: ['Pass mock A2 test with 75%+', 'Know ~2,200 words', 'Read simple German texts', 'Hold 5-minute conversation'],
  },
  {
    month: 7, phase: 'Intermediate', level: 'B1',
    title: 'Going Deeper',
    grammar: ['Konjunktiv II fully (all verbs)', 'Passive voice: present + past', 'Indirect speech (Konjunktiv I)', 'Extended adjective phrases', 'Noun compounds', 'Participial phrases'],
    vocabulary: ['German news and current events', 'Philosophy and opinion', 'Literature and culture', 'Abstract concepts: freedom, justice, democracy', 'Academic vocabulary'],
    targetWords: 2700,
    resources: [
      { name: 'Deutsch für Euch: Konjunktiv II', url: 'https://youtube.com/@DeutschFuerEuch', type: 'video' },
      { name: 'DW News Articles in German', url: 'https://dw.com/de', type: 'reading' },
      { name: 'Clozemaster B1', url: 'https://clozemaster.com', type: 'exercise' },
      { name: 'Comprehensible German B1', url: 'https://youtube.com/@ComprehensibleGerman', type: 'video' },
    ],
    dailyTasks: ['20 min Clozemaster B1', '20 min Konjunktiv II practice', '15 min read DW German article', '10 min write 250-word opinion piece'],
    checkpoint: ['Express opinions, wishes & hypotheticals', 'Understand Easy German without subtitles', 'Know ~2,700 words'],
  },
  {
    month: 8, phase: 'Intermediate', level: 'B1',
    title: 'Real Content Immersion',
    grammar: ['Verb prefixes: trennbare & untrennbare', 'Genitive case full mastery', 'Advanced relative clauses (wessen, was, wo)', 'Nominalization (das Lesen, das Fahren)', 'Idioms and fixed expressions'],
    vocabulary: ['Politics and society', 'Economy and work', 'Health and medicine', 'German history basics', 'Phrasal expressions and collocations'],
    targetWords: 3200,
    resources: [
      { name: 'Heute Show (YouTube)', url: 'https://youtube.com/@heuteshow', type: 'video' },
      { name: 'Slow German Ep. 40–60', url: 'https://slowgerman.com', type: 'podcast' },
      { name: 'German Wikipedia Articles', url: 'https://de.wikipedia.org', type: 'reading' },
      { name: 'Clozemaster: B1 Advanced', url: 'https://clozemaster.com', type: 'exercise' },
    ],
    dailyTasks: ['30 min Clozemaster advanced', '20 min read German Wikipedia', '20 min Heute Show or Extra 3', '10 min write 300-word news summary'],
    checkpoint: ['Read German news articles', 'Know ~3,200 words', 'Understand German comedy shows 60%+'],
  },
  {
    month: 9, phase: 'Intermediate', level: 'B1',
    title: 'B1 Mastery',
    grammar: ['Full passive voice review', 'Discourse markers (einerseits/andererseits, zunächst)', 'Extended participial constructions', 'Formal vs. informal registers', 'Full subjunctive review'],
    vocabulary: ['Formal writing vocabulary', 'Legal and administrative basics', 'Science and technology', 'German cultural references', 'Advanced connectors and transitions'],
    targetWords: 3700,
    resources: [
      { name: 'Comprehensible German B1–B2', url: 'https://youtube.com/@ComprehensibleGerman', type: 'video' },
      { name: 'Readlang: German Articles', url: 'https://readlang.com', type: 'reading' },
      { name: 'Goethe Institut B1 Sample Papers', url: 'https://goethe.de', type: 'exam' },
      { name: 'Coffee Break German Season 3', url: 'https://coffeebreaklanguages.com', type: 'podcast' },
    ],
    dailyTasks: ['20 min Clozemaster', '20 min Spiegel/Zeit article (Readlang)', '20 min Coffee Break German S3', '10 min write formal email'],
    checkpoint: ['Pass mock B1 test 70%+', 'Know ~3,700 words', 'Write formal emails', 'Hold 30-min conversations'],
  },
  {
    month: 10, phase: 'Upper-Intermediate', level: 'B2',
    title: 'Sophistication',
    grammar: ['Konjunktiv I (reported speech)', 'Advanced subordinating conjunctions: sodass, sofern', 'Gerundive constructions', 'Modal particles: doch, mal, ja, eben, eigentlich', 'Complex sentence building', 'Advanced adjective constructions'],
    vocabulary: ['Academic writing', 'Philosophical concepts', 'Ethics and morality', 'Advanced idioms and proverbs', 'Regional expressions'],
    targetWords: 4200,
    resources: [
      { name: 'Der Spiegel Online', url: 'https://spiegel.de', type: 'reading' },
      { name: 'Naturlich Deutsch B2', url: 'https://youtube.com/@NaturlichDeutsch', type: 'video' },
      { name: 'Deutschlandfunk Nova Podcast', url: 'https://deutschlandfunk.de', type: 'podcast' },
      { name: 'Clozemaster Advanced', url: 'https://clozemaster.com', type: 'exercise' },
    ],
    dailyTasks: ['30 min Clozemaster advanced', '20 min modal particles practice', '20 min Der Spiegel article', '10 min write 400-word argumentative essay'],
    checkpoint: ['Understand & use modal particles', 'Read quality newspapers', 'Know ~4,200 words'],
  },
  {
    month: 11, phase: 'Upper-Intermediate', level: 'B2',
    title: 'Near-Fluency Push',
    grammar: ['Full grammar review & gap-filling', 'Nominalization vs. verb-heavy writing', 'Complex prepositional phrases', 'Advanced word order — Mittelfeld', 'Collocations and register awareness'],
    vocabulary: ['Word families and derivation (vor-, nach-, über-, um-)', 'Formal register words', 'B2 exam vocabulary', 'Cultural literacy: German films, literature'],
    targetWords: 4700,
    resources: [
      { name: 'Tatort Episodes (YouTube)', url: 'https://youtube.com', type: 'video' },
      { name: 'Deutschlandfunk Daily Podcast', url: 'https://deutschlandfunk.de', type: 'podcast' },
      { name: 'DW Documentaries (German)', url: 'https://youtube.com/@DWDocumentary', type: 'video' },
      { name: 'Telc B2 Sample Tests', url: 'https://telc.net', type: 'exam' },
    ],
    dailyTasks: ['30 min mock exam practice', '20 min German film (German subtitles)', '20 min Deutschlandfunk podcast', '10 min write 500-word essay'],
    checkpoint: ['Complete two full B2 mock tests', 'Know ~4,700 words', 'Write well-structured essays', 'Conversations flow naturally'],
  },
  {
    month: 12, phase: 'Upper-Intermediate', level: 'B2',
    title: 'B2 Exam Ready',
    grammar: ['Full B2 grammar consolidation', 'Exam strategy: Reading & Listening', 'Writing: Essays and formal letters', 'Speaking: Opinion giving, agreeing, disagreeing', 'Error pattern analysis'],
    vocabulary: ['B2 exam high-frequency vocabulary', 'Opinion language: meiner Meinung nach, einerseits...', 'Transition words for essays', 'All previous vocabulary review'],
    targetWords: 5000,
    resources: [
      { name: 'Goethe Institut B2 Sample Papers', url: 'https://goethe.de', type: 'exam' },
      { name: 'Telc B2 Practice Tests', url: 'https://telc.net', type: 'exam' },
      { name: 'Deutsch Akademie B2 Tests', url: 'https://deutschakademie.de', type: 'exam' },
      { name: 'Reverso Context', url: 'https://context.reverso.net', type: 'exercise' },
    ],
    dailyTasks: ['45 min full mock exam section', '20 min weak-area grammar drill', '20 min timed essay writing', '15 min speaking practice with partner'],
    checkpoint: ['Score 70%+ on full B2 practice test', 'Know 5,000+ words', 'Write 500-word essay on abstract topics', 'Sustain 45-min German discussion'],
  },
];

const CYBER_ROADMAP = [
  {
    month: 1, phase: 'Foundation', level: 'Beginner',
    title: 'Linux & Command Line Mastery',
    color: '#00ff88',
    skills: [
      'File system navigation (cd, ls, pwd)',
      'File manipulation (cat, nano, vi, grep, find)',
      'Permissions (chmod, chown, rwx)',
      'Process management (ps, kill, top)',
      'Networking commands (ifconfig, ping, netstat)',
      'Bash scripting: variables, loops, conditionals',
      'Automating recon tasks with Bash',
    ],
    tools: ['Kali Linux VM', 'OverTheWire Bandit', 'Terminal'],
    resources: [
      { name: 'Linux for Hackers — NetworkChuck', url: 'https://youtube.com/@NetworkChuck', type: 'video' },
      { name: 'OverTheWire Bandit (Levels 0–20)', url: 'https://overthewire.org/wargames/bandit/', type: 'lab' },
      { name: 'Bash Scripting for Hackers — HackerSploit', url: 'https://youtube.com/@HackerSploit', type: 'video' },
      { name: 'Bash Scripting Tutorial — ryans-tutorials', url: 'https://ryanstutorials.net/bash-scripting-tutorial/', type: 'reading' },
    ],
    dailyTasks: [
      '90 min deep work: Linux video + practice in Kali VM',
      '50 min OverTheWire Bandit challenges',
      '15 min document commands learned in GitHub',
      '10 min Anki cards review (commands + ports)',
    ],
    project: 'Auto-Recon Script — takes IP, runs ping + nmap + whois, saves to file',
    checkpoint: [
      'Complete Bandit levels 0–20',
      'Navigate Linux confidently without help',
      'Write a Bash script that automates a recon task',
      'Upload 1 project to GitHub with README',
    ],
  },
  {
    month: 2, phase: 'Foundation', level: 'Beginner',
    title: 'Python for Pentesting',
    color: '#00ff88',
    skills: [
      'Variables, data types (strings, lists, dicts)',
      'Control flow (if/else, for/while loops)',
      'Functions and modules',
      'File operations (reading, writing)',
      'Error handling (try/except)',
      'Socket programming for network tasks',
      'HTTP requests with requests library',
      'HTML parsing with BeautifulSoup',
    ],
    tools: ['Python 3', 'Kali Linux', 'GitHub', 'Anki'],
    resources: [
      { name: 'Python for Beginners — Corey Schafer', url: 'https://youtube.com/@coreyms', type: 'video' },
      { name: 'HackinScience Python Exercises', url: 'https://www.hackinscience.org/', type: 'lab' },
      { name: 'Socket Programming — Tech With Tim', url: 'https://youtube.com/@TechWithTim', type: 'video' },
      { name: 'LearnPython.org (free, in-browser)', url: 'https://learnpython.org', type: 'exercise' },
    ],
    dailyTasks: [
      '90 min deep work: Python video + replicate all code',
      '50 min solve 2-3 HackinScience exercises',
      '15 min upload code to GitHub with comments',
      '10 min Anki review',
    ],
    project: 'Subdomain Enumerator — takes domain, tests common subdomains, outputs CSV',
    checkpoint: [
      'Build a port scanner in Python',
      'Build a subdomain enumerator',
      '2 Python projects on GitHub with READMEs',
      'Understand TCP vs UDP fundamentals',
    ],
  },
  {
    month: 3, phase: 'Foundation', level: 'Beginner',
    title: 'Networking & Web Fundamentals',
    color: '#00ff88',
    skills: [
      'OSI Model — all 7 layers',
      'TCP 3-way handshake',
      'Common ports (80, 443, 22, 21, 445, 3389)',
      'IP addressing and subnetting basics',
      'DNS, HTTP, HTTPS deep understanding',
      'HTTP methods (GET, POST, PUT, DELETE)',
      'HTTP headers, cookies, sessions',
      'Burp Suite Community Edition basics',
    ],
    tools: ['Wireshark', 'Burp Suite Community', 'Cisco Packet Tracer', 'Browser DevTools'],
    resources: [
      { name: 'Free CCNA — NetworkChuck (Ep. 1–10)', url: 'https://youtube.com/@NetworkChuck', type: 'video' },
      { name: 'HTTP Crash Course — Traversy Media', url: 'https://youtube.com/@TraversyMedia', type: 'video' },
      { name: 'Burp Suite Official Docs', url: 'https://portswigger.net/burp/documentation', type: 'reading' },
      { name: 'Wireshark Tutorial — David Bombal', url: 'https://youtube.com/@davidbombal', type: 'video' },
    ],
    dailyTasks: [
      '90 min deep work: networking video + Wireshark capture',
      '50 min Burp Suite practice — intercept own traffic',
      '15 min draw network diagrams or subnetting practice',
      '10 min Anki review',
    ],
    project: 'HTTP Request Analyzer — captures and logs HTTP traffic patterns',
    checkpoint: [
      'Explain OSI model from memory',
      'Intercept and modify HTTP requests in Burp Suite',
      'Read and understand raw Wireshark packet captures',
      'Know all common port numbers by heart',
    ],
  },
  {
    month: 4, phase: 'Web Pentesting', level: 'Intermediate',
    title: 'OWASP Top 10 — Injection Attacks',
    color: '#00f5ff',
    skills: [
      'SQL Injection (in-band, blind, time-based)',
      'NoSQL Injection',
      'Command Injection',
      'XSS — Reflected, Stored, DOM-based',
      'Using sqlmap for automated SQLi',
      'Manual SQLi payload crafting',
      'Burp Suite Repeater and Intruder',
      'OWASP Testing methodology',
    ],
    tools: ['Burp Suite', 'sqlmap', 'DVWA', 'Juice Shop', 'PortSwigger Academy'],
    resources: [
      { name: 'PortSwigger Web Security Academy — SQLi', url: 'https://portswigger.net/web-security/sql-injection', type: 'lab' },
      { name: 'DVWA Setup & Labs', url: 'https://github.com/digininja/DVWA', type: 'lab' },
      { name: 'PwnFunction XSS Explained', url: 'https://youtube.com/@PwnFunction', type: 'video' },
      { name: 'TryHackMe OWASP Top 10 Room', url: 'https://tryhackme.com/room/owasptop10', type: 'lab' },
    ],
    dailyTasks: [
      '90 min PortSwigger Academy labs (SQLi or XSS)',
      '50 min DVWA or Juice Shop hands-on practice',
      '15 min write up findings in notes',
      '10 min Anki review (payloads + techniques)',
    ],
    project: 'SQL Injection Scanner — tests a URL for common SQLi vulnerabilities',
    checkpoint: [
      'Complete all PortSwigger SQLi labs',
      'Complete all PortSwigger XSS labs',
      'Exploit DVWA at medium difficulty',
      'Write a basic SQL injection report',
    ],
  },
  {
    month: 5, phase: 'Web Pentesting', level: 'Intermediate',
    title: 'Authentication & Access Control Attacks',
    color: '#00f5ff',
    skills: [
      'Broken Authentication vulnerabilities',
      'Session hijacking and fixation',
      'IDOR (Insecure Direct Object Reference)',
      'Broken Access Control',
      'CSRF (Cross-Site Request Forgery)',
      'JWT attacks and token manipulation',
      'Password attacks — brute force, credential stuffing',
      'Burp Suite Scanner basics',
    ],
    tools: ['Burp Suite Pro (Community)', 'Hydra', 'PortSwigger Academy', 'JWT.io'],
    resources: [
      { name: 'PortSwigger — Authentication Labs', url: 'https://portswigger.net/web-security/authentication', type: 'lab' },
      { name: 'PortSwigger — Access Control Labs', url: 'https://portswigger.net/web-security/access-control', type: 'lab' },
      { name: 'PortSwigger — CSRF Labs', url: 'https://portswigger.net/web-security/csrf', type: 'lab' },
      { name: 'IppSec HackTheBox Walkthroughs', url: 'https://youtube.com/@ippsec', type: 'video' },
    ],
    dailyTasks: [
      '90 min PortSwigger Academy — auth and access labs',
      '50 min HackTheBox or TryHackMe machine',
      '15 min write findings and methodology notes',
      '10 min Anki review',
    ],
    project: 'IDOR Detector — automated script to find object reference vulnerabilities',
    checkpoint: [
      'Complete all PortSwigger authentication labs',
      'Complete all PortSwigger access control labs',
      'Exploit a JWT vulnerability in a lab',
      'Complete 2 TryHackMe web pentesting rooms',
    ],
  },
  {
    month: 6, phase: 'Web Pentesting', level: 'Intermediate',
    title: 'Advanced Web Attacks & Bug Bounty',
    color: '#00f5ff',
    skills: [
      'SSRF (Server Side Request Forgery)',
      'XXE (XML External Entity)',
      'File upload vulnerabilities',
      'Directory traversal and LFI/RFI',
      'Business logic vulnerabilities',
      'HTTP request smuggling basics',
      'Bug bounty report writing',
      'Responsible disclosure process',
    ],
    tools: ['Burp Suite', 'ffuf', 'Nikto', 'HackerOne', 'Bugcrowd'],
    resources: [
      { name: 'PortSwigger — SSRF Labs', url: 'https://portswigger.net/web-security/ssrf', type: 'lab' },
      { name: 'PortSwigger — File Upload Labs', url: 'https://portswigger.net/web-security/file-upload', type: 'lab' },
      { name: 'HackerOne Hacker101 CTF', url: 'https://ctf.hacker101.com/', type: 'lab' },
      { name: 'Bug Bounty Bootcamp — NahamSec', url: 'https://youtube.com/@NahamSec', type: 'video' },
    ],
    dailyTasks: [
      '90 min PortSwigger advanced labs (SSRF, XXE, uploads)',
      '50 min Hacker101 CTF challenges',
      '15 min write a mock bug bounty report',
      '10 min Anki review',
    ],
    project: 'Complete 5 CTF challenges and write professional bug reports for each',
    checkpoint: [
      'Complete PortSwigger SSRF and XXE labs',
      'Submit first HackerOne VDP report',
      'Complete 5 Hacker101 CTF flags',
      'Write 3 professional vulnerability reports',
    ],
  },
  {
    month: 7, phase: 'API & Automation', level: 'Advanced',
    title: 'REST API Pentesting',
    color: '#ff8c00',
    skills: [
      'REST API architecture and testing methodology',
      'OWASP API Top 10',
      'API authentication attacks (OAuth, API keys)',
      'Mass assignment vulnerabilities',
      'API rate limiting bypass',
      'Fuzzing API endpoints',
      'Postman for API testing',
      'API documentation analysis',
    ],
    tools: ['Postman', 'Burp Suite', 'ffuf', 'crAPI', 'OWASP API Top 10'],
    resources: [
      { name: 'OWASP API Security Top 10', url: 'https://owasp.org/www-project-api-security/', type: 'reading' },
      { name: 'crAPI Vulnerable API Lab', url: 'https://github.com/OWASP/crAPI', type: 'lab' },
      { name: 'InsiderPhD API Hacking Series', url: 'https://youtube.com/@InsiderPhD', type: 'video' },
      { name: 'HackTricks API Security', url: 'https://book.hacktricks.xyz/', type: 'reading' },
    ],
    dailyTasks: [
      '90 min API theory + crAPI lab setup and exploration',
      '50 min Postman API fuzzing practice',
      '15 min document API vulnerabilities found',
      '10 min Anki review',
    ],
    project: 'API Security Testing Framework — automated tool to test common API vulnerabilities',
    checkpoint: [
      'Complete all crAPI challenges',
      'Exploit 3 OWASP API Top 10 vulnerabilities in labs',
      'Build an API fuzzing script in Python',
      'Write an API penetration test report',
    ],
  },
  {
    month: 8, phase: 'API & Automation', level: 'Advanced',
    title: 'GraphQL & Custom Tooling',
    color: '#ff8c00',
    skills: [
      'GraphQL architecture and introspection',
      'GraphQL injection attacks',
      'Batching attacks and DoS via GraphQL',
      'Custom Python pentesting tools',
      'Automating vulnerability scanning',
      'Scripting Burp Suite extensions',
      'Wordlist generation and optimization',
      'Advanced ffuf and feroxbuster usage',
    ],
    tools: ['GraphQL Voyager', 'Damn Vulnerable GraphQL App', 'Python', 'Burp Suite'],
    resources: [
      { name: 'Damn Vulnerable GraphQL App', url: 'https://github.com/dolevf/Damn-Vulnerable-GraphQL-Application', type: 'lab' },
      { name: 'GraphQL Hacking — Rana Khalil', url: 'https://youtube.com/@RanaKhalil101', type: 'video' },
      { name: 'PayloadsAllTheThings GitHub', url: 'https://github.com/swisskyrepo/PayloadsAllTheThings', type: 'reading' },
      { name: 'HackTricks GraphQL Section', url: 'https://book.hacktricks.xyz/', type: 'reading' },
    ],
    dailyTasks: [
      '90 min GraphQL lab challenges',
      '50 min build custom Python automation tool',
      '15 min update GitHub portfolio with new tools',
      '10 min Anki review',
    ],
    project: 'GraphQL Security Scanner — detects introspection enabled and common misconfigurations',
    checkpoint: [
      'Complete DVGA (Damn Vulnerable GraphQL App)',
      'Build 2 custom automation tools in Python',
      'Perform a full API penetration test on a lab target',
      'Portfolio has 6+ projects on GitHub',
    ],
  },
  {
    month: 9, phase: 'API & Automation', level: 'Advanced',
    title: 'Advanced Automation & CTF Mastery',
    color: '#ff8c00',
    skills: [
      'Chaining multiple vulnerabilities',
      'Advanced Burp Suite workflows',
      'Nuclei templates for custom scanning',
      'Subdomain enumeration at scale',
      'GitHub dorking for bug bounty',
      'Google dorking techniques',
      'Report writing at professional level',
      'HackTheBox medium difficulty machines',
    ],
    tools: ['Nuclei', 'Amass', 'Subfinder', 'HackTheBox', 'TryHackMe'],
    resources: [
      { name: 'HackTheBox Academy — Web Pentesting', url: 'https://academy.hackthebox.com/', type: 'lab' },
      { name: 'Nuclei Templates Documentation', url: 'https://nuclei.projectdiscovery.io/', type: 'reading' },
      { name: 'IppSec — HTB Machine Walkthroughs', url: 'https://youtube.com/@ippsec', type: 'video' },
      { name: 'Bug Bounty Tips — Twitter #bugbounty', url: 'https://twitter.com/hashtag/bugbounty', type: 'community' },
    ],
    dailyTasks: [
      '90 min HackTheBox machine or advanced lab',
      '50 min build Nuclei custom template or automation',
      '15 min write professional pentest report section',
      '10 min Anki review',
    ],
    project: 'Complete API Testing Framework — full automated recon to exploitation pipeline',
    checkpoint: [
      'Complete 10 HackTheBox machines total',
      'Write 5 professional-grade pentest reports',
      'Submit 3 real bug bounty reports (VDP programs)',
      'Portfolio has 8+ projects on GitHub',
    ],
  },
  {
    month: 10, phase: 'Active Directory', level: 'Expert',
    title: 'Active Directory Fundamentals',
    color: '#9d4edd',
    skills: [
      'Active Directory architecture and components',
      'Domain Controllers, forests, trusts',
      'LDAP enumeration',
      'Kerberos authentication deep dive',
      'BloodHound for AD mapping',
      'PowerView and PowerSploit',
      'Initial access techniques',
      'Local privilege escalation',
    ],
    tools: ['BloodHound', 'PowerView', 'Impacket', 'Evil-WinRM', 'GOAD Lab'],
    resources: [
      { name: 'Active Directory Series — TheCyberMentor', url: 'https://youtube.com/@TCMSecurityAcademy', type: 'video' },
      { name: 'TryHackMe — Active Directory Path', url: 'https://tryhackme.com/paths', type: 'lab' },
      { name: 'GOAD Lab Setup (Game of Active Directory)', url: 'https://github.com/Orange-Cyberdefense/GOAD', type: 'lab' },
      { name: 'HackTricks — Active Directory Section', url: 'https://book.hacktricks.xyz/windows-hardening/active-directory-methodology', type: 'reading' },
    ],
    dailyTasks: [
      '90 min AD theory + BloodHound lab exploration',
      '50 min TryHackMe AD room or GOAD lab',
      '15 min document attack paths found',
      '10 min Anki review (AD commands + techniques)',
    ],
    project: 'AD Enumeration Script — automated BloodHound data collection and analysis',
    checkpoint: [
      'Set up GOAD lab environment',
      'Map an AD environment with BloodHound',
      'Complete TryHackMe AD fundamentals path',
      'Perform local privilege escalation in lab',
    ],
  },
  {
    month: 11, phase: 'Active Directory', level: 'Expert',
    title: 'AD Lateral Movement & Persistence',
    color: '#9d4edd',
    skills: [
      'Pass-the-Hash and Pass-the-Ticket',
      'Kerberoasting and AS-REP Roasting',
      'Golden Ticket and Silver Ticket attacks',
      'DCSync attack',
      'Lateral movement techniques',
      'Mimikatz for credential dumping',
      'Persistence mechanisms',
      'Domain Dominance techniques',
    ],
    tools: ['Mimikatz', 'Impacket', 'CrackMapExec', 'Rubeus', 'BloodHound'],
    resources: [
      { name: 'Rana Khalil — AD Attack Walkthroughs', url: 'https://youtube.com/@RanaKhalil101', type: 'video' },
      { name: 'HackTheBox — Active Directory Machines', url: 'https://hackthebox.com', type: 'lab' },
      { name: 'Impacket Suite Documentation', url: 'https://github.com/fortra/impacket', type: 'reading' },
      { name: 'SpecterOps BloodHound Docs', url: 'https://bloodhound.readthedocs.io/', type: 'reading' },
    ],
    dailyTasks: [
      '90 min advanced AD attack techniques in GOAD',
      '50 min HackTheBox AD machine',
      '15 min document attack chain and methodology',
      '10 min Anki review',
    ],
    project: 'Full AD Attack Chain — recon to domain compromise in GOAD lab environment',
    checkpoint: [
      'Successfully Kerberoast in lab environment',
      'Perform Golden Ticket attack in lab',
      'Complete DCSync and dump all hashes',
      'Compromise full GOAD domain',
    ],
  },
  {
    month: 12, phase: 'Active Directory', level: 'Expert',
    title: 'Job-Ready — Portfolio & Reporting',
    color: '#9d4edd',
    skills: [
      'Full penetration test methodology (PTES)',
      'Executive and technical report writing',
      'Remediation recommendations',
      'Professional communication with clients',
      'Interview preparation for pentesting roles',
      'CVE research and vulnerability analysis',
      'Responsible disclosure mastery',
      'Building public security presence',
    ],
    tools: ['All previous tools', 'GitHub Portfolio', 'LinkedIn', 'HackerOne'],
    resources: [
      { name: 'PTES — Pentest Execution Standard', url: 'http://www.pentest-standard.org/', type: 'reading' },
      { name: 'DEF CON Talks — YouTube', url: 'https://youtube.com/@DEFCONConference', type: 'video' },
      { name: 'TCM Security Report Templates', url: 'https://tcm-sec.com/', type: 'reading' },
      { name: 'HackerOne Public Reports', url: 'https://hackerone.com/hacktivity', type: 'reading' },
    ],
    dailyTasks: [
      '90 min complete a full mock pentest engagement',
      '50 min write professional pentest report',
      '20 min update GitHub portfolio and LinkedIn',
      '10 min review public bug bounty reports for learning',
    ],
    project: 'Full Pentest Report — complete web + AD engagement report ready for employers',
    checkpoint: [
      '12 projects on GitHub with professional READMEs',
      '50+ CTF challenges completed total',
      'Submit 5+ real bug bounty reports',
      'Portfolio reviewed and job applications sent',
    ],
  },
];

const CYBER_RESOURCE_ICONS: Record<string, string> = {
  video: '▶',
  lab: '⚡',
  exercise: '✏️',
  reading: '📖',
  community: '👥',
};

const RESOURCE_ICONS: Record<string, string> = {
  video: '▶',
  podcast: '🎧',
  exercise: '✏️',
  flashcard: '🃏',
  reading: '📖',
  speaking: '🗣️',
  worksheet: '📄',
  exam: '📝',
  app: '📱',
};

const WEEK_SCHEDULE: Record<number, { label: string; color: string; bg: string }[]> = {
  0: [{ label: 'Rest', color: '#6b6b8a', bg: 'rgba(107,107,138,0.15)' }],
  1: [{ label: 'Gym', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Study', color: '#00f5ff', bg: 'rgba(0,245,255,0.12)' }, { label: 'Work', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' }],
  2: [{ label: 'Run', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Work', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' }, { label: 'Read', color: '#00f5ff', bg: 'rgba(0,245,255,0.12)' }],
  3: [{ label: 'Gym', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Deep Work', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' }],
  4: [{ label: 'Study', color: '#00f5ff', bg: 'rgba(0,245,255,0.12)' }, { label: 'Work', color: '#ff8c00', bg: 'rgba(255,140,0,0.12)' }, { label: 'Game', color: '#9d4edd', bg: 'rgba(157,78,221,0.12)' }],
  5: [{ label: 'Gym', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Study', color: '#00f5ff', bg: 'rgba(0,245,255,0.12)' }, { label: 'Social', color: '#9d4edd', bg: 'rgba(157,78,221,0.12)' }],
  6: [{ label: 'Walk', color: '#00ff88', bg: 'rgba(0,255,136,0.12)' }, { label: 'Game', color: '#9d4edd', bg: 'rgba(157,78,221,0.12)' }],
};

function todayStr(baseDate?: Date | null) {
  if (baseDate) return baseDate.toISOString().split('T')[0];
  // Fallback to current date (client-only) for contexts where no Date is passed
  if (typeof window !== 'undefined') return new Date().toISOString().split('T')[0];
  return '';
}

function getWeekDates(baseDate?: Date | null): Date[] | null {
  if (!baseDate) return null; // Return null during SSR to avoid hydration mismatch
  const day = baseDate.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(baseDate);
    d.setDate(baseDate.getDate() - day + i);
    return d;
  });
}

const DEFAULT_TASKS: Task[] = [
  { id: '1', name: 'Morning workout — chest & triceps', category: 'body', time: '07:00', done: false, date: todayStr() },
  { id: '2', name: 'Study session — 2 focused pomodoros', category: 'mind', time: '09:00', done: false, date: todayStr() },
  { id: '3', name: 'Deep work block — project tasks', category: 'work', time: '11:00', done: false, date: todayStr() },
  { id: '4', name: 'Urge surfing meditation (5 min)', category: 'quit', time: '14:00', done: false, date: todayStr() },
  { id: '5', name: 'Evening walk or light jog', category: 'body', time: '18:00', done: false, date: todayStr() },
  { id: '6', name: 'Read 20 pages', category: 'mind', time: '20:00', done: false, date: todayStr() },
  { id: '7', name: 'Gaming or social time (1.5h max)', category: 'fun', time: '21:30', done: false, date: todayStr() },
];

const DEFAULT_HABITS: Habit[] = [
  { id: 'body', label: 'Gym', icon: '💪', color: '#00ff88', streak: 12, bestStreak: 12, todayDone: false, weekProgress: 71, totalDays: 12, lastDone: '' },
  { id: 'mind', label: 'Study', icon: '📚', color: '#00f5ff', streak: 8, bestStreak: 8, todayDone: false, weekProgress: 85, totalDays: 8, lastDone: '' },
  { id: 'work', label: 'Work', icon: '⚡', color: '#ff8c00', streak: 21, bestStreak: 21, todayDone: false, weekProgress: 100, totalDays: 21, lastDone: '' },
  { id: 'quit', label: 'No Smoke', icon: '🚫', color: '#ff3366', streak: 15, bestStreak: 15, todayDone: false, weekProgress: 90, totalDays: 15, lastDone: '' },
  { id: 'fun', label: 'Balanced', icon: '🎮', color: '#9d4edd', streak: 5, bestStreak: 5, todayDone: false, weekProgress: 50, totalDays: 5, lastDone: '' },
];

function HabitRing({ progress, color, size = 56 }: { progress: number; color: string; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (progress / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ - dash}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

function NotificationToast({ notifications }: {
  notifications: { id: string; message: string; color: string }[]
}) {
  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      {notifications.map(n => (
        <div key={n.id} style={{
          padding: '12px 18px', borderRadius: 10,
          background: 'var(--bg-card)',
          border: `1px solid ${n.color}60`,
          boxShadow: `0 0 20px ${n.color}20`,
          fontFamily: 'var(--font-mono)', fontSize: 12,
          color: n.color, letterSpacing: 0.5,
          animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
          maxWidth: 300,
        }}>
          {n.message}
        </div>
      ))}
    </div>
  );
}

// ── TASKS SECTION ─────────────────────────────────────────────────
const TasksSection = memo(function TasksSection({ tasks, setTasks, currentTodayStr }: { tasks: Task[]; setTasks: React.Dispatch<React.SetStateAction<Task[]>>; currentTodayStr: string }) {
  const [showAdd, setShowAdd] = useState(false);
  const [filter, setFilter] = useState<Category | 'all'>('all');
  const [newTask, setNewTask] = useState({ name: '', category: 'body' as Category, time: '09:00' });

  function toggleTask(id: string) { setTasks((prev: Task[]) => prev.map(t => t.id === id ? { ...t, done: !t.done } : t)); }
  function deleteTask(id: string) { setTasks((prev: Task[]) => prev.filter(t => t.id !== id)); }
  function addTask() {
    if (!newTask.name.trim()) return;
    setTasks((prev: Task[]) => [...prev, { id: Date.now().toString(), ...newTask, done: false, date: currentTodayStr || new Date().toISOString().split('T')[0] }].sort((a, b) => a.time.localeCompare(b.time)));
    setNewTask({ name: '', category: 'body', time: '09:00' });
    setShowAdd(false);
  }

  const filtered = tasks.filter(t => filter === 'all' ? true : t.category === filter);
  const done = filtered.filter(t => t.done).length;

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Task Manager</div>
        <div className="header-greeting">Mission <span>Control</span></div>
        <div className="header-date">{done}/{filtered.length} tasks completed today</div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
        {(['all', 'body', 'mind', 'work', 'quit', 'fun'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid',
            borderColor: filter === f ? 'var(--cyan)' : 'var(--border)',
            background: filter === f ? 'var(--cyan-glow)' : 'transparent',
            color: filter === f ? 'var(--cyan)' : 'var(--text-secondary)',
            fontFamily: 'var(--font-mono)', fontSize: 11, cursor: 'pointer',
            letterSpacing: 1, textTransform: 'uppercase' as const, transition: 'all 0.2s'
          }}>{f === 'all' ? 'ALL' : `${f === 'body' ? '💪' : f === 'mind' ? '📚' : f === 'work' ? '⚡' : f === 'quit' ? '🚭' : '🎮'} ${CATEGORY_LABELS[f as Category]}`}</button>
        ))}
        <button onClick={() => setShowAdd(true)} style={{
          marginLeft: 'auto', padding: '8px 20px', borderRadius: 8,
          background: 'var(--cyan)', color: '#000', border: 'none',
          fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, letterSpacing: 2, cursor: 'pointer'
        }}>+ NEW TASK</button>
      </div>
      <div className="card">
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>No tasks. Add one above.</div>
        )}
        {filtered.sort((a, b) => a.time.localeCompare(b.time)).map(task => (
          <div key={task.id} style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Main Task Row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div className={`task-check ${task.done ? 'done' : ''}`} onClick={() => toggleTask(task.id)} style={{ marginTop: 2 }}>{task.done ? '✓' : ''}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div className="task-name" onClick={() => toggleTask(task.id)} style={{ textDecoration: task.done ? 'line-through' : 'none', cursor: 'pointer' }}>{task.name}</div>
                  {task.priority && (
                    <span style={{ padding: '2px 8px', background: getPriorityColor(task.priority), color: '#0a0a1a', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{getPriorityLabel(task.priority)}</span>
                  )}
                  {task.isRecurring && (
                    <span style={{ padding: '2px 8px', background: 'rgba(0,255,136,0.2)', color: '#00ff88', borderRadius: 4, fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>↻ {(task.recurrence || 'daily').toUpperCase()}</span>
                  )}
                </div>
                <div className="task-meta">
                  <span>{task.time}</span>
                  <span className={`task-tag tag-${task.category}`}>{CATEGORY_LABELS[task.category]}</span>
                  {task.estimatedTime && (
                    <span style={{ color: getTimeColor(task), fontFamily: 'var(--font-mono)', fontSize: 12 }}>⏱️ {formatTime(task.actualTime || 0)}/{formatTime(task.estimatedTime)}</span>
                  )}
                  <span>{task.date}</span>
                </div>
              </div>
              <button onClick={() => deleteTask(task.id)}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 16, padding: '0 8px' }}>✕</button>
            </div>

            {/* Subtasks */}
            {task.subtasks && task.subtasks.length > 0 && (
              <div style={{ marginLeft: 32, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {task.subtasks.map(subtask => (
                  <div key={subtask.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, color: '#a0a0c0' }}>
                    <input
                      type="checkbox"
                      checked={subtask.done}
                      onChange={() => setTasks((prev: Task[]) => prev.map(t => t.id === task.id ? { ...t, subtasks: t.subtasks?.map(st => st.id === subtask.id ? { ...st, done: !st.done } : st) } : t))}
                      style={{ cursor: 'pointer', width: 14, height: 14 }}
                    />
                    <span style={{ textDecoration: subtask.done ? 'line-through' : 'none', color: subtask.done ? '#6b6b8a' : '#a0a0c0' }}>☑️ {subtask.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-title">// ADD NEW TASK</div>
            <div className="input-group">
              <label className="input-label">TASK NAME</label>
              <input className="input-field" placeholder="What do you need to do?" value={newTask.name}
                onChange={e => setNewTask(p => ({ ...p, name: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && addTask()} autoFocus />
            </div>
            <div className="input-group">
              <label className="input-label">CATEGORY</label>
              <select className="input-select" value={newTask.category} onChange={e => setNewTask(p => ({ ...p, category: e.target.value as Category }))}>
                <option value="body">💪 Body</option>
                <option value="mind">📚 Mind</option>
                <option value="work">⚡ Work</option>
                <option value="quit">🚭 Quit Smoking</option>
                <option value="fun">🎮 Fun</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">TIME</label>
              <input className="input-field" type="time" value={newTask.time} onChange={e => setNewTask(p => ({ ...p, time: e.target.value }))} />
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={addTask}>EXECUTE TASK</button>
              <button className="btn-secondary" onClick={() => setShowAdd(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ── HABITS SECTION ────────────────────────────────────────────────
const HabitsSection = memo(function HabitsSection({ habits, setHabits, toggleHabit }: { habits: Habit[]; setHabits: (h: Habit[] | ((prev: Habit[]) => Habit[])) => void; toggleHabit: (id: string) => void }) {
  function toggle(id: string) {
    toggleHabit(id);
  }

  const handleAddHabit = (newHabit: any) => {
    setHabits((prev: Habit[]) => [...prev, {
      id: newHabit.id as Category,
      label: newHabit.label,
      icon: newHabit.icon,
      color: newHabit.color,
      streak: 0,
      bestStreak: 0,
      todayDone: false,
      weekProgress: 0,
      totalDays: 0,
      lastDone: '',
      isCustom: true,
    }]);
  };

  const handleDeleteHabit = (habitId: string) => {
    setHabits((prev: Habit[]) => prev.filter(h => h.id !== habitId));
  };

  const handleUpdateHabit = (habitId: string, updates: any) => {
    setHabits((prev: Habit[]) => prev.map(h => h.id === habitId ? { ...h, ...updates } : h));
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Habit Tracker</div>
        <div className="header-greeting">Habit <span>Core</span></div>
        <div className="header-date">{habits.filter(h => h.todayDone).length}/{habits.length} habits completed today</div>
      </div>

      {/* Habit Management */}
      <div style={{ marginBottom: 28, padding: 20, background: 'var(--bg-secondary)', borderRadius: 12, border: '1px solid var(--border)' }}>
        <HabitManagementPanel
          habits={habits}
          onAddHabit={handleAddHabit}
          onDeleteHabit={handleDeleteHabit}
          onUpdateHabit={handleUpdateHabit}
        />
      </div>

      {/* Habit Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
        {habits.map(habit => (
          <div key={habit.id} className="card" onClick={() => toggle(habit.id as Category)}
            style={{ borderColor: habit.todayDone ? `${habit.color}40` : undefined, cursor: 'pointer', transition: 'all 0.3s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div className="habit-ring" style={{ width: 72, height: 72 }}>
                <HabitRing progress={habit.todayDone ? 100 : habit.weekProgress} color={habit.color} size={72} />
                <div className="habit-ring-value" style={{ color: habit.color, fontSize: 14 }}>{habit.todayDone ? '✓' : `${habit.weekProgress}%`}</div>
              </div>
              <div>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{habit.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700, color: habit.todayDone ? habit.color : 'var(--text-primary)', letterSpacing: 1 }}>{habit.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--orange)', marginTop: 2 }}>🔥 {habit.streak} day streak</div>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${habit.weekProgress}%`, background: habit.color }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
              <span>Week progress</span><span style={{ color: habit.color }}>{habit.weekProgress}%</span>
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: habit.todayDone ? `${habit.color}15` : 'var(--bg-secondary)', border: `1px solid ${habit.todayDone ? habit.color + '40' : 'var(--border)'}`, textAlign: 'center', fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: habit.todayDone ? habit.color : 'var(--text-muted)', letterSpacing: 2, transition: 'all 0.3s' }}>
              {habit.todayDone ? '✓ DONE TODAY' : 'CLICK TO MARK DONE'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

// ── QUIT COUNTER CARD ─────────────────────────────────────────────
function QuitCounterCard({ quitDate, setQuitDate, smokeStats }: {
  quitDate: string;
  setQuitDate: (d: string) => void;
  smokeStats: SmokeStats;
}) {
  const [maxDate, setMaxDate] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setMaxDate(new Date().toISOString().split('T')[0]);
  }, []);
  const milestones = [
    { days: 1, label: '24 Hours', desc: 'Heart rate normalizes', icon: '🫀' },
    { days: 3, label: '3 Days', desc: 'Nicotine fully cleared', icon: '🧹' },
    { days: 7, label: '1 Week', desc: 'Taste & smell improving', icon: '👃' },
    { days: 14, label: '2 Weeks', desc: 'Circulation improves', icon: '💓' },
    { days: 30, label: '1 Month', desc: 'Lung capacity increases', icon: '🫁' },
    { days: 90, label: '3 Months', desc: 'Circulation fully restored', icon: '⚡' },
  ];

  const nextMilestone = milestones.find(m => m.days > smokeStats.days);

  return (
    <div className="card" style={{ border: '1px solid rgba(0,255,136,0.2)' }}>
      <div className="card-header">
        <div className="card-title" style={{ color: 'var(--green)' }}>// Quit Counter</div>
        {quitDate && (
          <button className="card-action" style={{ color: 'var(--red)' }}
            onClick={() => setShowResetConfirm(true)}>
            RESET
          </button>
        )}
      </div>

      {!quitDate ? (
        // ── NO QUIT DATE SET ──
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🚭</div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--text-primary)', marginBottom: 6 }}>
            Set Your Quit Date
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
            Enter the date you stopped smoking.<br />Your counter starts from that moment.
          </div>
          <input type="date" className="input-field"
            max={maxDate}
            onChange={e => e.target.value && setQuitDate(e.target.value)}
            style={{ textAlign: 'center', cursor: 'pointer', maxWidth: 200, margin: '0 auto' }} />
        </div>
      ) : (
        // ── QUIT DATE IS SET ──
        <div>
          {/* Big counter */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 56, fontWeight: 900, color: 'var(--green)', textShadow: '0 0 30px rgba(0,255,136,0.4)', lineHeight: 1 }}>
              {smokeStats.days}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', letterSpacing: 2, marginTop: 4 }}>
              DAYS SMOKE-FREE
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
              {smokeStats.hours}h · {smokeStats.minutes}min total
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Money Saved', value: `$${smokeStats.moneySaved}`, color: 'var(--green)', icon: '💰' },
              { label: 'Cigs Avoided', value: `${smokeStats.cigarettes}`, color: 'var(--cyan)', icon: '🚬' },
            ].map((s, i) => (
              <div key={i} style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: 14, textAlign: 'center' }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, color: s.color }}>{s.value}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Progress to 90 day goal */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>Progress to 90-day goal</span>
              <span style={{ color: 'var(--green)' }}>{Math.round(smokeStats.percent)}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${smokeStats.percent}%`, background: 'linear-gradient(90deg, var(--green), var(--cyan))' }} />
            </div>
          </div>

          {/* Next milestone */}
          {nextMilestone && (
            <div style={{ padding: 12, borderRadius: 8, background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.15)', marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', letterSpacing: 2, marginBottom: 4 }}>NEXT MILESTONE</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 20 }}>{nextMilestone.icon}</span>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, color: 'var(--text-primary)', fontWeight: 700 }}>{nextMilestone.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)' }}>
                    {nextMilestone.desc} · {nextMilestone.days - smokeStats.days} days away
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* All milestones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {milestones.map(ms => (
              <div key={ms.days} className={`milestone ${smokeStats.days >= ms.days ? 'achieved' : ''}`}>
                <span className="milestone-icon">{ms.icon}</span>
                <div className="milestone-info">
                  <div className="milestone-name">{ms.label}</div>
                  <div className="milestone-desc">{ms.desc}</div>
                </div>
                <span>{smokeStats.days >= ms.days ? '✅' : `${ms.days - smokeStats.days}d`}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 380, textAlign: 'center' }}>
            <div className="modal-title" style={{ color: 'var(--red)' }}>⚠️ RESET QUIT DATE</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
              This will reset your {smokeStats.days}-day streak and all saved progress. This action cannot be undone.
            </div>
            <div className="modal-actions">
              <button className="btn-primary" style={{ background: 'var(--red)', flex: 1 }} onClick={() => { setQuitDate(''); setShowResetConfirm(false); }}>YES, RESET</button>
              <button className="btn-secondary" onClick={() => setShowResetConfirm(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── STATS SECTION ─────────────────────────────────────────────────
const StatsSection = memo(function StatsSection({ tasks, habits, quitDate, setQuitDate, smokeStats }: { tasks: Task[]; habits: Habit[]; quitDate: string; setQuitDate: (d: string) => void; smokeStats: SmokeStats }) {
  const completed = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const moneySaved = smokeStats.moneySaved;
  const categoryBreakdown = (['body', 'mind', 'work', 'quit', 'fun'] as Category[]).map(cat => ({
    cat,
    total: tasks.filter(t => t.category === cat).length,
    done: tasks.filter(t => t.category === cat && t.done).length,
    color: cat === 'body' ? '#00ff88' : cat === 'mind' ? '#00f5ff' : cat === 'work' ? '#ff8c00' : cat === 'quit' ? '#ff3366' : '#9d4edd',
  }));
  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Analytics</div>
        <div className="header-greeting">Progress <span>Report</span></div>
        <div className="header-date">Real data. Real growth.</div>
      </div>
      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Overall Completion', value: `${pct}%`, sub: `${completed} of ${total} tasks`, accent: 'var(--cyan)' },
          { label: 'Days Smoke Free', value: `${smokeStats.days}`, sub: `$${moneySaved} saved`, accent: 'var(--green)' },
          { label: 'Best Streak', value: `${Math.max(...habits.map(h => h.streak))}d`, sub: 'consecutive days', accent: 'var(--orange)' },
          { label: 'Habits Done Today', value: `${habits.filter(h => h.todayDone).length}/${habits.length}`, sub: 'habits completed', accent: 'var(--purple)' },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ '--accent-color': s.accent } as React.CSSProperties}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header"><div className="card-title">// Category Breakdown</div></div>
          {categoryBreakdown.map(c => (
            <div key={c.cat} style={{ marginBottom: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                <span style={{ color: c.color }}>{CATEGORY_LABELS[c.cat]}</span>
                <span style={{ color: 'var(--text-secondary)' }}>{c.done}/{c.total}</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: c.total > 0 ? `${(c.done / c.total) * 100}%` : '0%', background: c.color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="card">
          <div className="card-header"><div className="card-title">// Habit Streaks</div></div>
          {habits.map(h => (
            <div key={h.id} style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <span style={{ fontSize: 20 }}>{h.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-primary)', marginBottom: 4 }}>{h.label}</div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min((h.streak / 30) * 100, 100)}%`, background: h.color }} />
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, color: h.color }}>🔥{h.streak}</span>
            </div>
          ))}
        </div>
        <QuitCounterCard
          quitDate={quitDate}
          setQuitDate={setQuitDate}
          smokeStats={smokeStats}
        />
      </div>
    </div>
  );
});

// ── ANALYTICS SECTION ──────────────────────────────────────────────
const AnalyticsSection = memo(function AnalyticsSection({ tasks, habits, settings, smokeStats }: { tasks: Task[]; habits: Habit[]; settings: Settings; smokeStats: SmokeStats }) {
  const [loading, setLoading] = useState(false);

  // Memoize analytics data transformations to prevent expensive re-calculations on every dashboard re-render
  const weeklyData = useMemo(() => getWeeklyProgressData(tasks), [tasks]);
  const categoryData = useMemo(() => getCategoryBreakdown(tasks), [tasks]);
  const streakData = useMemo(() => getStreakHistory(habits), [habits]);
  const completionStats = useMemo(() => getCompletionStats(tasks), [tasks]);

  async function handleExportPDF() {
    setLoading(true);
    try {
      await exportDataToPDF(tasks, habits, settings, smokeStats);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Analytics</div>
        <div className="header-greeting">Data <span>Insights</span></div>
        <div className="header-date">Track your progress across all categories and habits</div>
      </div>

      {/* Export Buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 28 }}>
        <button
          onClick={() => exportTasksToCSV(tasks)}
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #00ff88, #00cc6a)',
            color: '#0a0a1a',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            transition: 'all 0.3s',
          }}
        >
          📥 Tasks CSV
        </button>
        <button
          onClick={() => exportHabitsToCSV(habits)}
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #00f5ff, #0099cc)',
            color: '#0a0a1a',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            transition: 'all 0.3s',
          }}
        >
          📥 Habits CSV
        </button>
        <button
          onClick={() => exportAllDataToCSV(tasks, habits)}
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #ff8c00, #ff6600)',
            color: '#0a0a1a',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            transition: 'all 0.3s',
          }}
        >
          📥 All Data CSV
        </button>
        <button
          onClick={handleExportPDF}
          disabled={loading}
          style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #ff3366, #cc1a4d)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontWeight: 700,
            cursor: loading ? 'default' : 'pointer',
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            opacity: loading ? 0.6 : 1,
            transition: 'all 0.3s',
          }}
        >
          {loading ? '⏳ PDF...' : '📄 PDF Report'}
        </button>
      </div>

      {/* Charts */}
      <CompletionDonut stats={completionStats} />
      <WeeklyProgressChart data={weeklyData} />
      <CategoryBreakdownChart data={categoryData} />
      <StreakRanking data={streakData} />
    </div>
  );
});

// ── PLANNER SECTION ───────────────────────────────────────────────
const PlannerSection = memo(function PlannerSection({ addTask, notify, aiSchedule, setAiSchedule }: {
  addTask: (t: Omit<Task, 'id' | 'done' | 'date'>) => void;
  notify: (msg: string, color?: string) => void;
  aiSchedule: any;
  setAiSchedule: (s: any) => void;
}) {
  const [now, setNow] = useState<Date | null>(null);
  const weekDates = getWeekDates(now);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const [loading, setLoading] = useState(false);
  const [germanMonth] = useLocalStorage<number>('german-month', 1);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ wakeTime: '07:00', sleepTime: '23:00', gymDays: '3', workHours: '4', energyType: 'morning', goals: '' });

  async function generateSchedule() {
    if (!form.goals.trim()) { setError('Please describe your goals first.'); return; }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, germanMonth }),
      });
      const rawData = await res.json();
      // Normalize: API returns { schedule: [...] } but UI expects { week: [...] }
      const data = rawData.week ? rawData : { ...rawData, week: rawData.schedule || [] };
      setAiSchedule(data);
      setShowForm(false);

      // Auto-sync today's plan to task manager
      const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' }); // e.g. "Monday"
      const todayPlan = data.week?.find((day: { day: string }) =>
        day.day.toLowerCase().includes(todayName.toLowerCase())
      );

      if (todayPlan?.blocks) {
        todayPlan.blocks.forEach((block: { time: string; activity: string; category: string }) => {
          addTask({
            name: block.activity,
            category: (block.category as Category) || 'work',
            time: block.time,
          });
        });
        notify(`📅 ${todayPlan.blocks.length} tasks synced from AI weekly plan!`, 'var(--cyan)');
      }
    } catch {
      setError('Connection failed. Check your API key in .env.local');
    } finally {
      setLoading(false);
    }
  }

  const categoryColor: Record<string, string> = {
    body: '#00ff88', mind: '#00f5ff', work: '#ff8c00', quit: '#ff3366', fun: '#9d4edd',
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // AI Planner</div>
        <div className="header-greeting">Command <span>Grid</span></div>
        <div className="header-date">Your week, designed by AI around your life</div>
      </div>

      {/* Generate button */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        <button className="btn-primary" style={{ padding: '12px 28px' }} onClick={() => setShowForm(true)}>
          ◉ GENERATE MY WEEK WITH AI
        </button>
        {aiSchedule && (
          <button className="btn-secondary" onClick={() => setShowForm(true)}>Regenerate</button>
        )}
      </div>

      {/* AI Insight */}
      {aiSchedule?.weekInsight && (
        <div className="ai-insight" style={{ marginBottom: 24 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>◉ AI WEEK STRATEGY</div>
          <div className="ai-insight-text">{aiSchedule.weekInsight}</div>
        </div>
      )}

      {/* AI Generated Schedule */}
      {aiSchedule ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {aiSchedule.week.map((dayPlan: any, i: number) => (
            <div key={i} className="card">
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div className="card-title">{dayPlan.day.toUpperCase()}</div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', letterSpacing: 1, textTransform: 'uppercase' }}>{dayPlan.theme}</span>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>{dayPlan.blocks.length} blocks</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dayPlan.blocks.map((block: any, j: number) => (
                  <div key={j} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 8, background: 'var(--bg-secondary)', border: `1px solid ${categoryColor[block.category] || 'var(--border)'}20` }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)', minWidth: 50 }}>{block.time}</div>
                    <div style={{ width: 3, height: '100%', minHeight: 36, borderRadius: 2, background: categoryColor[block.category] || 'var(--border)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>{block.activity}</div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: categoryColor[block.category] || 'var(--text-muted)' }}>{block.duration}</span>
                        <span className={`task-tag tag-${block.category}`}>{block.category}</span>
                        {block.notes && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', fontStyle: 'italic' }}>{block.notes}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        // Fallback static grid
        <div className="card">
          <div className="card-header">
            <div className="card-title">// Default Week View</div>
            <span className="card-action">Click Generate to use AI</span>
          </div>
          <div className="week-grid">
            {weekDates ? weekDates.map((date, i) => (
              <div key={i} className="day-col">
                <div className="day-header">
                  <div className="day-name">{DAYS[date.getDay()]}</div>
                  <div className={`day-num ${now && date.getDay() === now.getDay() && date.getDate() === now.getDate() ? 'today' : ''}`}>{date.getDate()}</div>
                </div>
                {(WEEK_SCHEDULE[i] || []).map((block, j) => (
                  <div key={j} className="day-block" style={{ background: block.bg, color: block.color, border: `1px solid ${block.color}30` }}>{block.label}</div>
                ))}
              </div>
            )) : (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: 16 }}>Loading schedule...</div>
            )}
          </div>
        </div>
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" style={{ width: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-title">◉ AI SCHEDULE GENERATOR</div>

            {error && (
              <div style={{ padding: 12, borderRadius: 8, background: 'rgba(255,51,102,0.1)', border: '1px solid rgba(255,51,102,0.3)', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: 12, marginBottom: 16 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="input-group">
                <label className="input-label">WAKE UP TIME</label>
                <input className="input-field" type="time" value={form.wakeTime} onChange={e => setForm(p => ({ ...p, wakeTime: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">SLEEP TIME</label>
                <input className="input-field" type="time" value={form.sleepTime} onChange={e => setForm(p => ({ ...p, sleepTime: e.target.value }))} />
              </div>
              <div className="input-group">
                <label className="input-label">GYM DAYS / WEEK</label>
                <select className="input-select" value={form.gymDays} onChange={e => setForm(p => ({ ...p, gymDays: e.target.value }))}>
                  {['1', '2', '3', '4', '5', '6'].map(n => <option key={n} value={n}>{n} days</option>)}
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">WORK/STUDY HOURS</label>
                <select className="input-select" value={form.workHours} onChange={e => setForm(p => ({ ...p, workHours: e.target.value }))}>
                  {['2', '3', '4', '5', '6', '7', '8'].map(n => <option key={n} value={n}>{n} hours/day</option>)}
                </select>
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">ENERGY TYPE</label>
                <select className="input-select" value={form.energyType} onChange={e => setForm(p => ({ ...p, energyType: e.target.value }))}>
                  <option value="morning">🌅 Morning person — peak energy AM</option>
                  <option value="evening">🌙 Night owl — peak energy PM</option>
                  <option value="balanced">⚡ Balanced — consistent energy</option>
                </select>
              </div>
              <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                <label className="input-label">YOUR GOALS THIS WEEK</label>
                <textarea className="input-field" rows={3}
                  style={{ resize: 'vertical' }}
                  placeholder="e.g. Pass my math exam, build gym habit, stay smoke-free, finish work project, improve English..."
                  value={form.goals}
                  onChange={e => setForm(p => ({ ...p, goals: e.target.value }))} />
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={generateSchedule} disabled={loading} style={{ opacity: loading ? 0.7 : 1 }}>
                {loading ? '◉ GENERATING...' : '◉ GENERATE MY WEEK'}
              </button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>CANCEL</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

// ── GERMAN TRANSLATIONS ──────────────────────────────────────────
const GRAMMAR_ARABIC: Record<string, string> = {
  'German alphabet & pronunciation (ä, ö, ü, ß)': 'الأبجدية الألمانية والنطق',
  'Nouns & grammatical gender (der, die, das)': 'الأسماء والجنس النحوي',
  'Personal pronouns (ich, du, er, sie, wir...)': 'الضمائر الشخصية',
  'Present tense: sein & haben': 'المضارع: الفعلان sein و haben',
  'Basic word order: Subject–Verb–Object': 'ترتيب الكلمات: فاعل-فعل-مفعول',
  'Numbers 1–100': 'الأرقام من ١ إلى ١٠٠',
  'Nominative and Accusative cases': 'حالة الفاعل والمفعول به',
  'Definite & indefinite articles (der/die/das, ein/eine)': 'أدوات التعريف والتنكير',
  'Plural forms of nouns (8 patterns)': 'صيغ الجمع (٨ أنماط)',
  'Regular & irregular present tense verbs': 'الأفعال المنتظمة وغير المنتظمة في المضارع',
  'Modal verbs: können, wollen, müssen': 'الأفعال الناقصة: يستطيع، يريد، يجب',
  'Negation with nicht and kein': 'النفي بـ nicht و kein',
  'Dative case (geben, helfen, gefallen)': 'حالة المفعول غير المباشر',
  'Common prepositions + case (in, auf, mit, von, zu)': 'حروف الجر الشائعة مع حالاتها',
  'Separable verbs (aufmachen, anrufen)': 'الأفعال المنفصلة',
  'Present progressive (gerade)': 'المضارع المستمر',
  'Possessive pronouns (mein, dein, sein)': 'ضمائر الملكية',
  'Time expressions: heute, morgen, gestern': 'تعبيرات الزمن: اليوم، غداً، أمس',
};

const DAILY_TASKS_ARABIC: Record<string, string> = {
  '15 min Anki flashcard review': '١٥ دقيقة مراجعة بطاقات Anki',
  '20 min DW Nicos Weg episode': '٢٠ دقيقة حلقة من Nicos Weg',
  '15 min Coffee Break German podcast': '١٥ دقيقة بودكاست Coffee Break German',
  '10 min shadowing: repeat phrases out loud': '١٠ دقيقة تكرار الجمل بصوت عالٍ',
  '15 min Anki review': '١٥ دقيقة مراجعة Anki',
  '20 min Nicos Weg episode': '٢٠ دقيقة حلقة Nicos Weg',
  '15 min modal verbs practice': '١٥ دقيقة تدريب على الأفعال الناقصة',
  '10 min write shopping dialogue': '١٠ دقيقة كتابة حوار تسوق',
  '20 min Easy German video': '٢٠ دقيقة فيديو Easy German',
  '15 min Deutsch Akademie exercises': '١٥ دقيقة تمارين Deutsch Akademie',
  '10 min write daily routine paragraph': '١٠ دقيقة كتابة فقرة عن روتينك اليومي',
};

// ── GERMAN SECTION ────────────────────────────────────────────────
const GermanSection = memo(function GermanSection({
  tasks, addTask, notify,
}: {
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'done' | 'date'>) => void;
  notify: (msg: string, color?: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useLocalStorage<number>('german-month', 1);
  const [wordsLearned, setWordsLearned] = useLocalStorage<number>('german-words', 0);
  const [studyStreak, setStudyStreak] = useLocalStorage<number>('german-streak', 0);
  const [lastStudyDate, setLastStudyDate] = useLocalStorage<string>('german-last-study', '');
  const [completedTopics, setCompletedTopics] = useLocalStorage<string[]>('german-topics', []);
  const [activeTab, setActiveTab] = useState<'overview' | 'grammar' | 'resources' | 'tasks'>('overview');
  const [tasksAddedDate, setTasksAddedDate] = useLocalStorage<string>('german-tasks-date', '');

  const roadmap = GERMAN_ROADMAP[currentMonth - 1];
  const today = new Date().toISOString().split('T')[0];

  // Auto-add today's German tasks every morning
  useEffect(() => {
    if (tasksAddedDate === today) return;
    const alreadyHasGermanTasks = tasks.some(t =>
      t.category === 'mind' && roadmap.dailyTasks.some(dt => t.name.includes(dt.slice(8, 20)))
    );
    if (!alreadyHasGermanTasks) {
      const times = ['07:00', '07:20', '07:45', '08:05'];
      roadmap.dailyTasks.forEach((task, i) => {
        addTask({ name: `🇩🇪 ${task}`, category: 'mind', time: times[i] || '08:00' });
      });
      setTasksAddedDate(today);
      notify('🇩🇪 German study tasks added for today!', 'var(--cyan)');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, tasksAddedDate]);

  function markStudied() {
    if (lastStudyDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastStudyDate === yesterday.toISOString().split('T')[0];
    setStudyStreak(wasYesterday ? studyStreak + 1 : 1);
    setLastStudyDate(today);
    setWordsLearned(w => w + 10);
    notify('🔥 Study streak updated! +10 words logged', 'var(--green)');
  }

  function toggleTopic(topic: string) {
    setCompletedTopics(prev =>
      prev.includes(topic) ? prev.filter(t => t !== topic) : [...prev, topic]
    );
  }

  const phaseColors: Record<string, string> = {
    Foundation: 'var(--green)',
    Building: 'var(--cyan)',
    Intermediate: 'var(--orange)',
    'Upper-Intermediate': 'var(--purple)',
  };
  const phaseColor = phaseColors[roadmap.phase] || 'var(--cyan)';
  const wordProgress = Math.min((wordsLearned / roadmap.targetWords) * 100, 100);
  const topicsProgress = Math.round((completedTopics.filter(t =>
    roadmap.grammar.includes(t)).length / roadmap.grammar.length) * 100);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="header-title">CyberSched // German Learning OS</div>
          <div className="header-greeting">
            Deutsch <span style={{ color: phaseColor }}>{roadmap.level}</span>
          </div>
          <div className="header-date">Month {currentMonth} of 12 — {roadmap.phase} Phase · {roadmap.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 11 }}
            onClick={() => setCurrentMonth(m => Math.max(1, m - 1))} disabled={currentMonth === 1}>← PREV</button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: phaseColor, padding: '8px 14px', border: `1px solid ${phaseColor}40`, borderRadius: 8 }}>
            M{currentMonth}
          </span>
          <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 11 }}
            onClick={() => setCurrentMonth(m => Math.min(12, m + 1))} disabled={currentMonth === 12}>NEXT →</button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'CURRENT PHASE', value: roadmap.phase, color: phaseColor, sub: roadmap.level },
          { label: 'WORDS LEARNED', value: wordsLearned.toLocaleString(), color: 'var(--green)', sub: `Target: ${roadmap.targetWords.toLocaleString()}` },
          { label: 'STUDY STREAK', value: `${studyStreak}d`, color: 'var(--orange)', sub: lastStudyDate === today ? '✓ studied today' : 'not yet today' },
          { label: 'GRAMMAR DONE', value: `${topicsProgress}%`, color: 'var(--purple)', sub: `${completedTopics.filter(t => roadmap.grammar.includes(t)).length}/${roadmap.grammar.length} topics` },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 2, marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Word Progress Bar */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Month {currentMonth} Word Target</span>
          <span style={{ color: 'var(--green)' }}>{wordsLearned} / {roadmap.targetWords} words</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${wordProgress}%`, background: phaseColor }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['overview', 'grammar', 'resources', 'tasks'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 18px', borderRadius: 8, fontFamily: 'var(--font-display)', fontSize: 11,
            fontWeight: 700, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s',
            background: activeTab === tab ? phaseColor : 'transparent',
            border: `1px solid ${activeTab === tab ? phaseColor : 'var(--border)'}`,
            color: activeTab === tab ? '#000' : 'var(--text-secondary)',
          }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Today's Tasks */}
          <div className="card">
            <div className="card-title" style={{ color: phaseColor, marginBottom: 16 }}>📅 Today's Study Plan</div>
            {roadmap.dailyTasks.map((task, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: phaseColor, flexShrink: 0 }} />
                <div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>
                    🇩🇪 {task}
                  </div>
                  {DAILY_TASKS_ARABIC[task] && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', direction: 'rtl', marginTop: 2 }}>
                      {DAILY_TASKS_ARABIC[task]}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <button className="btn-primary" style={{ width: '100%', marginTop: 16 }} onClick={markStudied}>
              {lastStudyDate === today ? '✓ STUDIED TODAY' : 'MARK DAY AS STUDIED'}
            </button>
          </div>

          {/* Checkpoint */}
          <div className="card">
            <div className="card-title" style={{ color: phaseColor, marginBottom: 16 }}>🏁 Month {currentMonth} Checkpoints</div>
            {roadmap.checkpoint.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${phaseColor}`, flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>

          {/* Vocabulary Themes */}
          <div className="card">
            <div className="card-title" style={{ color: phaseColor, marginBottom: 16 }}>📚 Vocabulary Themes This Month</div>
            {roadmap.vocabulary.map((v, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: phaseColor, fontSize: 12 }}>→</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)' }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 14 }}>
              <input type="number" className="input-field" placeholder="Log words learned today (e.g. 15)"
                style={{ marginBottom: 8 }}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    const val = parseInt((e.target as HTMLInputElement).value);
                    if (!isNaN(val) && val > 0) {
                      setWordsLearned(w => w + val);
                      (e.target as HTMLInputElement).value = '';
                      notify(`+${val} words logged!`, 'var(--green)');
                    }
                  }
                }} />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>Press Enter to log word count</div>
            </div>
          </div>

          {/* 12-Month Roadmap Mini */}
          <div className="card">
            <div className="card-title" style={{ color: phaseColor, marginBottom: 16 }}>🗺️ 12-Month Roadmap</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {GERMAN_ROADMAP.map(m => (
                <button key={m.month} onClick={() => setCurrentMonth(m.month)} style={{
                  padding: '8px 4px', borderRadius: 6, textAlign: 'center', cursor: 'pointer',
                  border: `1px solid ${m.month === currentMonth ? phaseColors[m.phase] : 'var(--border)'}`,
                  background: m.month === currentMonth ? `${phaseColors[m.phase]}15` : 'transparent',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: m.month === currentMonth ? phaseColors[m.phase] : 'var(--text-secondary)' }}>M{m.month}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{m.level}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GRAMMAR TAB */}
      {activeTab === 'grammar' && (
        <div className="card">
          <div className="card-title" style={{ color: phaseColor, marginBottom: 6 }}>📐 Grammar Topics — Month {currentMonth}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Click a topic to mark it as completed
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {roadmap.grammar.map((topic, i) => {
              const done = completedTopics.includes(topic);
              return (
                <div key={i} onClick={() => toggleTopic(topic)} style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${done ? phaseColor + '60' : 'var(--border)'}`,
                  background: done ? `${phaseColor}10` : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${done ? phaseColor : 'var(--border)'}`,
                    background: done ? phaseColor : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#000', fontWeight: 700,
                  }}>{done ? '✓' : ''}</div>
                  <div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: done ? phaseColor : 'var(--text-primary)', lineHeight: 1.4 }}>
                      {topic}
                    </span>
                    {GRAMMAR_ARABIC[topic] && (
                      <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', marginTop: 3, direction: 'rtl' }}>
                        {GRAMMAR_ARABIC[topic]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
            {completedTopics.filter(t => roadmap.grammar.includes(t)).length} / {roadmap.grammar.length} topics completed this month
          </div>
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {roadmap.resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', borderColor: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = phaseColor)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${phaseColor}15`, border: `1px solid ${phaseColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {RESOURCE_ICONS[r.type] || '🔗'}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: phaseColor, textTransform: 'uppercase', letterSpacing: 1 }}>{r.type}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>↗ Click to open resource</div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="card">
          <div className="card-title" style={{ color: phaseColor, marginBottom: 8 }}>🗓️ Today's German Tasks</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Tasks below are auto-synced to your main task manager under the Mind category.
          </div>
          {tasks.filter(t => t.category === 'mind' && t.name.startsWith('🇩🇪')).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              No German tasks for today yet.
              <br /><br />
              <button className="btn-primary" onClick={() => {
                const times = ['07:00', '07:20', '07:45', '08:05'];
                roadmap.dailyTasks.forEach((task, i) => {
                  addTask({ name: `🇩🇪 ${task}`, category: 'mind', time: times[i] || '08:00' });
                });
                setTasksAddedDate(today);
                notify('🇩🇪 German tasks added!', 'var(--cyan)');
              }}>
                + ADD TODAY'S GERMAN TASKS
              </button>
            </div>
          ) : (
            tasks.filter(t => t.category === 'mind' && t.name.startsWith('🇩🇪')).map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: '1px solid var(--border)',
                opacity: task.done ? 0.5 : 1,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${task.done ? 'var(--green)' : phaseColor}`,
                  background: task.done ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#000',
                }}>{task.done ? '✓' : ''}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', textDecoration: task.done ? 'line-through' : 'none' }}>{task.name}</div>
                  {DAILY_TASKS_ARABIC[task.name.replace('🇩🇪 ', '')] && (
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'var(--text-muted)', direction: 'rtl', marginTop: 2 }}>
                      {DAILY_TASKS_ARABIC[task.name.replace('🇩🇪 ', '')]}
                    </div>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{task.time}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

// ── SETTINGS SECTION ──────────────────────────────────────────────
const SettingsSection = memo(function SettingsSection({ settings, setSettings, tasks, setTasks, habits, setHabits, quitDate, setQuitDate, userId, notify }: { settings: Settings; setSettings: (s: Settings) => void; tasks: Task[]; setTasks: (t: Task[] | ((prev: Task[]) => Task[])) => void; habits: Habit[]; setHabits: (h: Habit[] | ((prev: Habit[]) => Habit[])) => void; quitDate: string; setQuitDate: (d: string) => void; userId: string; notify: (m: string, c?: string) => void }) {
  const [edited, setEdited] = useState(false);
  const [form, setForm] = useState(settings);

  function save() {
    setSettings(form);
    setEdited(false);
  }

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <div className="header-title">CyberSched // Settings</div>
        <div className="header-greeting">Personalize <span>Your</span> <span>Path</span></div>
        <div className="header-date">Customize your life OS for maximum resonance</div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">// User Profile</div>
        </div>
        <div className="input-group">
          <label className="input-label">YOUR NAME</label>
          <input className="input-field" value={form.name} onChange={e => { setForm(p => ({ ...p, name: e.target.value })); setEdited(true); }} placeholder="Enter your name" />
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title">// Smoking Stats (for savings calculation)</div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <div className="input-group">
            <label className="input-label">CIGARETTES PER DAY</label>
            <input className="input-field" type="number" min="1" value={form.cigarettesPerDay} onChange={e => { setForm(p => ({ ...p, cigarettesPerDay: Number(e.target.value) })); setEdited(true); }} />
          </div>
          <div className="input-group">
            <label className="input-label">COST PER PACK</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="input-field" type="number" min="0.01" step="0.01" value={form.costPerPack} onChange={e => { setForm(p => ({ ...p, costPerPack: Number(e.target.value) })); setEdited(true); }} style={{ flex: 1 }} />
              <input className="input-field" value={form.currency} onChange={e => { setForm(p => ({ ...p, currency: e.target.value })); setEdited(true); }} style={{ width: 60 }} />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">CIGARETTES PER PACK</label>
            <input className="input-field" type="number" min="1" value={form.cigarettesPerPack} onChange={e => { setForm(p => ({ ...p, cigarettesPerPack: Number(e.target.value) })); setEdited(true); }} />
          </div>
        </div>
      </div>
      {edited && (
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <button className="btn-primary" style={{ width: '100%' }} onClick={save}>
            SAVE SETTINGS
          </button>
          <button className="btn-secondary" onClick={() => { setForm(settings); setEdited(false); }}>CANCEL</button>
        </div>
      )}

      {/* Cloud Sync Info */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-title" style={{ color: 'var(--cyan)', marginBottom: 8 }}>☁️ Cloud Sync</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 12 }}>
          Your data syncs automatically. To use on another device, copy your User ID below and paste it into localStorage (cs-user-id) on the new device.
        </div>
        <div style={{ padding: '12px 16px', borderRadius: 8, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--cyan)', wordBreak: 'break-all', marginBottom: 12 }}>
          {userId || 'Loading...'}
        </div>
        <button className="btn-secondary" onClick={() => {
          if (userId) {
            navigator.clipboard.writeText(userId);
            notify('✓ User ID copied to clipboard', 'var(--green)');
          }
        }}>
          COPY USER ID
        </button>
      </div>
    </div>
  );
});

// ── AI MOTIVATION CARD ────────────────────────────────────────────
function AIMotivationCard({ settings, smokeStats, gymStreak, completionPct, goals }: {
  settings: Settings;
  smokeStats: SmokeStats;
  gymStreak: number;
  completionPct: number;
  goals: string;
}) {
  const [motivation, setMotivation] = useLocalStorage<string>('cybersched-motivation', '');
  const [motivDate, setMotivDate] = useLocalStorage<string>('cybersched-motiv-date', '');
  const [loading, setLoading] = useState(false);
  const hasGenerated = useRef(false);

  useEffect(() => {
    if (hasGenerated.current) return; // prevent double-fire
    const today = new Date().toISOString().split('T')[0];
    if (motivDate !== today) {
      hasGenerated.current = true;
      setLoading(true);
      fetch('/api/motivate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: settings.name,
          smokeDays: smokeStats.days,
          gymStreak,
          completionPct,
          goals: goals || 'become the best version',
        }),
      })
        .then(r => r.json())
        .then(d => {
          setMotivation(d.message);
          setMotivDate(today);
        })
        .catch(() => setMotivation('Every day smoke-free is a war won. Keep going.'))
        .finally(() => setLoading(false));
    } else {
      hasGenerated.current = true; // already generated today, skip
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="ai-insight" style={{ marginBottom: 20 }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--cyan)', letterSpacing: 2, marginBottom: 10 }}>◉ AI MOTIVATION</div>
      <div className="ai-insight-text">
        {loading ? 'Generating your daily message...' : motivation || 'Show up today. That is enough.'}
      </div>
    </div>
  );
}

// ── POMODORO TIMER ────────────────────────────────────────────────
const POMODORO_MODES = {
  work: { label: 'WORK', time: 25 * 60, color: 'var(--cyan)' },
  shortBreak: { label: 'SHORT BREAK', time: 5 * 60, color: 'var(--orange)' },
  longBreak: { label: 'LONG BREAK', time: 15 * 60, color: 'var(--green)' },
} as const;

function PomodoroTimer() {
  const [count, setCount] = useLocalStorage<number>('cybersched-pomodoros', 0);
  const [mode, setMode] = useState<'work' | 'shortBreak' | 'longBreak'>('work');
  const [time, setTime] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  const modes = POMODORO_MODES;

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (running && time > 0) {
      interval = setInterval(() => setTime(t => t - 1), 1000);
    } else if (time === 0 && running) {
      setRunning(false);
      if (mode === 'work') setCount(c => c + 1);
      setMode(mode === 'work' ? 'shortBreak' : 'work');
      setTime(modes[mode === 'work' ? 'shortBreak' : 'work'].time);
    }
    return () => { if (interval) clearInterval(interval); };
  }, [running, time, mode]);

  function reset() {
    setTime(modes[mode].time);
    setRunning(false);
  }

  const mins = Math.floor(time / 60);
  const secs = time % 60;
  const percent = mode === 'work' ? ((25 * 60 - time) / (25 * 60)) * 100 : 100;

  return (
    <div className="card" style={{ border: `1px solid ${modes[mode].color}40`, marginBottom: 20 }}>
      <div className="card-header">
        <div className="card-title" style={{ color: modes[mode].color }}>// Pomodoro</div>
        <span className="card-action" style={{ color: modes[mode].color }}>{count} sessions</span>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto', marginBottom: 18 }}>
          <svg width={140} height={140} viewBox="0 0 140 140" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={70} cy={70} r={60} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3} />
            <circle cx={70} cy={70} r={60} fill="none" stroke={modes[mode].color} strokeWidth={3}
              strokeDasharray={`${(percent / 100) * 2 * Math.PI * 60} ${2 * Math.PI * 60}`}
              strokeLinecap="round" style={{ filter: `drop-shadow(0 0 6px ${modes[mode].color})` }} />
          </svg>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 32, fontWeight: 900, color: modes[mode].color }}>{String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 1 }}>{modes[mode].label}</div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <button className="btn-primary" style={{ flex: 1, fontSize: 12 }} onClick={() => setRunning(!running)}>
          {running ? 'PAUSE' : 'START'}
        </button>
        <button className="btn-secondary" style={{ flex: 1, fontSize: 12 }} onClick={reset}>RESET</button>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {(Object.keys(modes) as Array<'work' | 'shortBreak' | 'longBreak'>).map(m => (
          <button key={m} onClick={() => { setMode(m); setTime(modes[m].time); setRunning(false); }}
            style={{
              flex: 1, padding: '6px 8px', borderRadius: 6, border: `1px solid`,
              borderColor: mode === m ? modes[m].color : 'var(--border)',
              background: mode === m ? `${modes[m].color}15` : 'transparent',
              color: mode === m ? modes[m].color : 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)', fontSize: 10, cursor: 'pointer',
              transition: 'all 0.2s',
            }}>
            {m === 'work' ? '25M' : m === 'shortBreak' ? '5M' : '15M'}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── AI CHAT CONTROLLER ────────────────────────────────────────────
interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: string;
}

function AIChatController({
  tasks, setTasks, habits, setHabits, settings, setSettings,
  quitDate, setQuitDate, setActiveNav, currentTodayStr, notify,
  addTask,
  completeTask,
  deleteTask,
  toggleHabit,
  aiSchedule,
  syncSchedule,
  loadSchedule,
  saveAIMessage,
  loadAIMemory,
  userId,
}: {
  tasks: Task[];
  setTasks: (t: Task[] | ((prev: Task[]) => Task[])) => void;
  habits: Habit[];
  setHabits: (h: Habit[] | ((prev: Habit[]) => Habit[])) => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
  quitDate: string;
  setQuitDate: (d: string) => void;
  setActiveNav: (n: NavSection) => void;
  currentTodayStr: string;
  notify: (msg: string, color?: string) => void;
  addTask: (t: any) => void;
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  toggleHabit: (id: string) => void;
  aiSchedule: any;
  syncSchedule: (s: any) => Promise<void>;
  loadSchedule: () => Promise<any>;
  saveAIMessage: (role: string, content: string) => Promise<void>;
  loadAIMemory: (limit?: number) => Promise<any[]>;
  userId: string;
}) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load previous AI messages from Supabase on mount
  useEffect(() => {
    if (!userId) return;
    async function loadHistory() {
      const history = await loadAIMemory(20);
      if (history.length > 0) {
        setMessages(history);
      } else {
        setMessages([{
          role: 'ai',
          content: `Hey ${settings.name}! I'm your CyberSched AI. I can see your full dashboard and control it directly. Try saying "add gym at 7am", "I just studied for 2 hours", "what should I focus on today", or "show my stats".`,
          timestamp: new Date().toTimeString().slice(0, 5),
        }]);
      }
    }
    loadHistory();
  }, [userId, settings.name]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function executeActions(actions: { action: string;[key: string]: unknown }[]) {
    for (const act of actions) {
      switch (act.action) {
        case 'ADD_TASK': {
          const t = act.task as any;
          addTask({
            name: t.name,
            category: t.category || 'work',
            time: t.time || '09:00',
            priority: t.priority || 'medium',
            isRecurring: t.isRecurring || false,
            recurrence: t.recurrence,
            subtasks: t.subtasks || [],
            estimatedTime: t.estimatedTime,
            actualTime: 0,
          });
          break;
        }

        case 'MARK_TASK_DONE': {
          const tid = act.taskId as string;
          completeTask(tid);
          break;
        }

        case 'NAVIGATE': {
          setActiveNav(act.section as NavSection);
          setOpen(false);
          break;
        }

        case 'SYNC_TODAY_FROM_PLAN': {
          const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
          const todayPlan = aiSchedule?.week?.find((day: any) =>
            day.day.toLowerCase().includes(todayName.toLowerCase())
          );
          if (todayPlan?.blocks) {
            todayPlan.blocks.forEach((block: any) => {
              setTasks((prev: Task[]) => [...prev, {
                id: Date.now().toString() + Math.random(),
                name: block.activity,
                category: (block.category as Category) || 'work',
                time: block.time,
                done: false,
                date: new Date().toISOString().split('T')[0],
              }]);
            });
            notify(`📅 Today's plan synced to tasks!`, 'var(--cyan)');
          }
          break;
        }

        case 'ADD_TASKS_BULK': {
          const bulkTasks = act.tasks as { name: string; category: Category; time: string }[];
          bulkTasks.forEach(t => {
            setTasks((prev: Task[]) => [...prev, {
              id: Date.now().toString() + Math.random(),
              name: t.name,
              category: t.category || 'work',
              time: t.time || '09:00',
              done: false,
              date: new Date().toISOString().split('T')[0],
            }]);
          });
          notify(`✅ ${bulkTasks.length} tasks added by AI`, 'var(--green)');
          break;
        }
      }
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');

    setMessages(prev => [...prev, {
      role: 'user',
      content: userMsg,
      timestamp: new Date().toTimeString().slice(0, 5),
    }]);

    setLoading(true);

    // After adding user message to state:
    await saveAIMessage('user', userMsg);

    try {
      const appState = {
        tasks: tasks.map((t: any) => ({ name: t.name, category: t.category, time: t.time, done: t.done, date: t.date })),
        habits: habits.map((h: any) => ({ id: h.id, label: h.label, streak: h.streak, todayDone: h.todayDone })),
        settings: { name: settings.name },
        smokeFree: { quitDate, daysClean: quitDate ? Math.floor((Date.now() - new Date(quitDate).getTime()) / 86400000) : 0 },
        today: new Date().toDateString(),
        todayName: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
        weeklyPlan: aiSchedule || null,
      };

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, appState }),
      });

      const data = await res.json();

      const aiMsg: ChatMessage = { role: 'ai', content: data.message || 'Done.', timestamp: new Date().toTimeString().slice(0, 5) };
      setMessages(prev => [...prev, aiMsg]);

      // After adding AI response to state:
      await saveAIMessage('ai', data.message || 'Done.');

      if (data.actions?.length > 0) executeActions(data.actions);
    } catch {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Connection error. Check your internet and try again.',
        timestamp: new Date().toTimeString().slice(0, 5),
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
    }}>
      <div className={`ai-chat-container ${open ? 'open' : ''}`} style={{
        position: 'fixed',
        bottom: 80,
        right: 24,
        width: 380,
        maxHeight: '70vh',
        zIndex: 9998,
        display: open ? 'flex' : 'none',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-bright)',
        borderRadius: 16,
        boxShadow: '0 0 60px rgba(0,245,255,0.1)',
        animation: 'slideUp 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div className="ai-chat-header" onClick={() => setOpen(!open)} style={{ cursor: 'pointer', padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="ai-status-dot" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: 1, color: 'var(--cyan)' }}>CYBERSCHED_AI_v2.0</span>
          </div>
          <div style={{ transform: open ? 'rotate(180deg)' : 'none', transition: '0.3s' }}>▲</div>
        </div>

        <div className="ai-chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {messages.map((m, i) => (
            <div key={i} className={`message ${m.role}`} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div className="message-content" style={{
                maxWidth: '85%', padding: '10px 14px', borderRadius: m.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                background: m.role === 'user' ? 'var(--cyan)' : 'var(--bg-secondary)',
                border: m.role === 'ai' ? '1px solid var(--border)' : 'none',
                color: m.role === 'user' ? '#000' : 'var(--text-primary)',
                fontSize: 13, lineHeight: 1.5,
              }}>{m.content}</div>
              <div className="message-time" style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 3 }}>{m.timestamp}</div>
            </div>
          ))}
          {loading && (
            <div className="message ai" style={{ display: 'flex', alignItems: 'flex-start' }}>
              <div className="message-content" style={{ padding: '10px 14px', borderRadius: '12px 12px 12px 4px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontStyle: 'italic', fontSize: 12 }}>Processing request...</div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="ai-chat-input-area" style={{ padding: '12px 16px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
          <input
            className="ai-chat-input"
            style={{ flex: 1, background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px', color: 'var(--text-primary)', outline: 'none' }}
            placeholder="Command..."
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
          />
          <button className="ai-chat-send" onClick={sendMessage} disabled={loading} style={{
            width: 42, height: 42, borderRadius: 10, background: 'var(--cyan)', border: 'none',
            color: '#000', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1
          }}>
            →
          </button>
        </div>
      </div>

      <button onClick={() => setOpen(!open)} style={{
        width: 56, height: 56, borderRadius: '50%', background: open ? 'var(--bg-card)' : 'var(--cyan)',
        border: `2px solid ${open ? 'var(--border-bright)' : 'var(--cyan)'}`,
        color: open ? 'var(--cyan)' : '#000',
        fontSize: 22, cursor: 'pointer',
        boxShadow: '0 0 30px rgba(0,245,255,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {open ? '✕' : '◉'}
      </button>
    </div>
  );
}


const CyberSection = memo(function CyberSection({
  tasks, addTask, notify,
}: {
  tasks: Task[];
  addTask: (t: Omit<Task, 'id' | 'done' | 'date'>) => void;
  notify: (msg: string, color?: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useLocalStorage<number>('cyber-month', 1);
  const [hoursLogged, setHoursLogged] = useLocalStorage<number>('cyber-hours', 0);
  const [studyStreak, setStudyStreak] = useLocalStorage<number>('cyber-streak', 0);
  const [lastStudyDate, setLastStudyDate] = useLocalStorage<string>('cyber-last-study', '');
  const [completedSkills, setCompletedSkills] = useLocalStorage<string[]>('cyber-skills', []);
  const [completedCheckpoints, setCompletedCheckpoints] = useLocalStorage<string[]>('cyber-checkpoints', []);
  const [activeTab, setActiveTab] = useState<'overview' | 'skills' | 'resources' | 'tasks'>('overview');
  const [tasksAddedDate, setTasksAddedDate] = useLocalStorage<string>('cyber-tasks-date', '');

  const roadmap = CYBER_ROADMAP[currentMonth - 1];
  const today = new Date().toISOString().split('T')[0];
  const phaseColor = roadmap.color;

  // Auto-add today's cyber tasks every morning
  useEffect(() => {
    if (tasksAddedDate === today) return;
    const alreadyHasCyberTasks = tasks.some(t =>
      t.category === 'work' && t.name.startsWith('🔐')
    );
    if (!alreadyHasCyberTasks) {
      const times = ['09:00', '10:30', '13:00', '15:00'];
      roadmap.dailyTasks.forEach((task, i) => {
        addTask({ name: `🔐 ${task}`, category: 'work', time: times[i] || '10:00' });
      });
      setTasksAddedDate(today);
      notify('🔐 Cybersecurity tasks added for today!', phaseColor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, tasksAddedDate]);

  function markStudied() {
    if (lastStudyDate === today) return;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const wasYesterday = lastStudyDate === yesterday.toISOString().split('T')[0];
    setStudyStreak(wasYesterday ? studyStreak + 1 : 1);
    setLastStudyDate(today);
    setHoursLogged(h => h + 3);
    notify('🔥 Study session logged! +3 hours', 'var(--green)');
  }

  function toggleSkill(skill: string) {
    setCompletedSkills(prev =>
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  }

  function toggleCheckpoint(cp: string) {
    setCompletedCheckpoints(prev =>
      prev.includes(cp) ? prev.filter(c => c !== cp) : [...prev, cp]
    );
  }

  const skillsProgress = Math.round(
    (completedSkills.filter(s => roadmap.skills.includes(s)).length / roadmap.skills.length) * 100
  );
  const checkpointProgress = Math.round(
    (completedCheckpoints.filter(c => roadmap.checkpoint.includes(c)).length / roadmap.checkpoint.length) * 100
  );

  const phaseColors: Record<string, string> = {
    Foundation: '#00ff88',
    'Web Pentesting': '#00f5ff',
    'API & Automation': '#ff8c00',
    'Active Directory': '#9d4edd',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div className="header-title">CyberSched // Cybersecurity OS</div>
          <div className="header-greeting">
            Pentest <span style={{ color: phaseColor }}>{roadmap.phase}</span>
          </div>
          <div className="header-date">Month {currentMonth} of 12 — {roadmap.title}</div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 11 }}
            onClick={() => setCurrentMonth(m => Math.max(1, m - 1))} disabled={currentMonth === 1}>← PREV</button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: phaseColor, padding: '8px 14px', border: `1px solid ${phaseColor}40`, borderRadius: 8 }}>
            M{currentMonth}
          </span>
          <button className="btn-secondary" style={{ padding: '8px 14px', fontSize: 11 }}
            onClick={() => setCurrentMonth(m => Math.min(12, m + 1))} disabled={currentMonth === 12}>NEXT →</button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'CURRENT PHASE', value: roadmap.phase, color: phaseColor, sub: roadmap.level },
          { label: 'HOURS LOGGED', value: `${hoursLogged}h`, color: 'var(--green)', sub: 'Total study time' },
          { label: 'STUDY STREAK', value: `${studyStreak}d`, color: 'var(--orange)', sub: lastStudyDate === today ? '✓ studied today' : 'not yet today' },
          { label: 'SKILLS DONE', value: `${skillsProgress}%`, color: 'var(--purple)', sub: `${completedSkills.filter(s => roadmap.skills.includes(s)).length}/${roadmap.skills.length} this month` },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-secondary)', letterSpacing: 2, marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 900, color: stat.color }}>{stat.value}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Phase Progress Bar */}
      <div className="card" style={{ marginBottom: 20, padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Month {currentMonth} Checkpoint Progress</span>
          <span style={{ color: phaseColor }}>{checkpointProgress}% complete</span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${checkpointProgress}%`, background: phaseColor }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {(['overview', 'skills', 'resources', 'tasks'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            padding: '10px 18px', borderRadius: 8, fontFamily: 'var(--font-display)', fontSize: 11,
            fontWeight: 700, letterSpacing: 2, cursor: 'pointer', transition: 'all 0.2s',
            background: activeTab === tab ? phaseColor : 'transparent',
            border: `1px solid ${activeTab === tab ? phaseColor : 'var(--border)'}`,
            color: activeTab === tab ? '#000' : 'var(--text-secondary)',
          }}>
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Today's Tasks */}
          <div className="card">
            <div className="card-title" style={{ color: phaseColor, marginBottom: 16 }}>📅 Today's Study Plan</div>
            {roadmap.dailyTasks.map((task, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: phaseColor, flexShrink: 0, marginTop: 6 }} />
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', lineHeight: 1.5 }}>🔐 {task}</span>
              </div>
            ))}
            <button className="btn-primary" style={{ width: '100%', marginTop: 16, background: phaseColor, borderColor: phaseColor }} onClick={markStudied}>
              {lastStudyDate === today ? '✓ SESSION LOGGED TODAY' : 'LOG TODAY\'S SESSION (+3h)'}
            </button>
          </div>

          {/* Project of the Month */}
          <div className="card">
            <div className="card-title" style={{ color: phaseColor, marginBottom: 16 }}>🛠️ Month {currentMonth} Project</div>
            <div style={{ padding: '16px', borderRadius: 10, background: `${phaseColor}10`, border: `1px solid ${phaseColor}30`, marginBottom: 16 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: phaseColor, letterSpacing: 2, marginBottom: 8 }}>BUILD THIS →</div>
              <div style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{roadmap.project}</div>
            </div>
            <div className="card-title" style={{ color: phaseColor, marginBottom: 12 }}>🏁 Checkpoints</div>
            {roadmap.checkpoint.map((cp, i) => (
              <div key={i} onClick={() => toggleCheckpoint(cp)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                  border: `2px solid ${completedCheckpoints.includes(cp) ? phaseColor : 'var(--border)'}`,
                  background: completedCheckpoints.includes(cp) ? phaseColor : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#000',
                }}>{completedCheckpoints.includes(cp) ? '✓' : ''}</div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: completedCheckpoints.includes(cp) ? phaseColor : 'var(--text-secondary)', lineHeight: 1.5, textDecoration: completedCheckpoints.includes(cp) ? 'line-through' : 'none' }}>{cp}</span>
              </div>
            ))}
          </div>

          {/* Tools */}
          <div className="card">
            <div className="card-title" style={{ color: phaseColor, marginBottom: 16 }}>🔧 Tools This Month</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {roadmap.tools.map((tool, i) => (
                <span key={i} style={{ padding: '6px 12px', borderRadius: 20, border: `1px solid ${phaseColor}40`, background: `${phaseColor}10`, fontFamily: 'var(--font-mono)', fontSize: 11, color: phaseColor }}>
                  {tool}
                </span>
              ))}
            </div>
          </div>

          {/* 12-Month Roadmap Mini */}
          <div className="card">
            <div className="card-title" style={{ color: phaseColor, marginBottom: 16 }}>🗺️ 12-Month Roadmap</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
              {CYBER_ROADMAP.map(m => (
                <button key={m.month} onClick={() => setCurrentMonth(m.month)} style={{
                  padding: '8px 4px', borderRadius: 6, textAlign: 'center', cursor: 'pointer',
                  border: `1px solid ${m.month === currentMonth ? phaseColors[m.phase] : 'var(--border)'}`,
                  background: m.month === currentMonth ? `${phaseColors[m.phase]}15` : 'transparent',
                  transition: 'all 0.2s',
                }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, fontWeight: 700, color: m.month === currentMonth ? phaseColors[m.phase] : 'var(--text-secondary)' }}>M{m.month}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)', marginTop: 2 }}>{m.phase.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SKILLS TAB */}
      {activeTab === 'skills' && (
        <div className="card">
          <div className="card-title" style={{ color: phaseColor, marginBottom: 6 }}>⚡ Skills — Month {currentMonth}: {roadmap.title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Click a skill to mark it as learned
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {roadmap.skills.map((skill, i) => {
              const done = completedSkills.includes(skill);
              return (
                <div key={i} onClick={() => toggleSkill(skill)} style={{
                  padding: '14px 16px', borderRadius: 10, cursor: 'pointer',
                  border: `1px solid ${done ? phaseColor + '60' : 'var(--border)'}`,
                  background: done ? `${phaseColor}10` : 'var(--bg-secondary)',
                  display: 'flex', alignItems: 'center', gap: 12, transition: 'all 0.2s',
                }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${done ? phaseColor : 'var(--border)'}`,
                    background: done ? phaseColor : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, color: '#000', fontWeight: 700,
                  }}>{done ? '✓' : ''}</div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: done ? phaseColor : 'var(--text-primary)', lineHeight: 1.4 }}>{skill}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, padding: 14, borderRadius: 10, background: 'var(--bg-secondary)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)' }}>
            {completedSkills.filter(s => roadmap.skills.includes(s)).length} / {roadmap.skills.length} skills mastered this month — {skillsProgress}% complete
          </div>
        </div>
      )}

      {/* RESOURCES TAB */}
      {activeTab === 'resources' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {roadmap.resources.map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
              <div className="card" style={{ cursor: 'pointer', transition: 'all 0.2s', borderColor: 'transparent' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = phaseColor)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: `${phaseColor}15`, border: `1px solid ${phaseColor}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {CYBER_RESOURCE_ICONS[r.type] || '🔗'}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>{r.name}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: phaseColor, textTransform: 'uppercase', letterSpacing: 1 }}>{r.type}</div>
                  </div>
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>↗ Click to open</div>
              </div>
            </a>
          ))}
        </div>
      )}

      {/* TASKS TAB */}
      {activeTab === 'tasks' && (
        <div className="card">
          <div className="card-title" style={{ color: phaseColor, marginBottom: 8 }}>🗓️ Today's Cyber Tasks</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginBottom: 20 }}>
            Auto-synced to your main task manager under Work category.
          </div>
          {tasks.filter(t => t.category === 'work' && t.name.startsWith('🔐')).length === 0 ? (
            <div style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
              No cyber tasks for today yet.
              <br /><br />
              <button className="btn-primary" style={{ background: phaseColor, borderColor: phaseColor }} onClick={() => {
                const times = ['09:00', '10:30', '13:00', '15:00'];
                roadmap.dailyTasks.forEach((task, i) => {
                  addTask({ name: `🔐 ${task}`, category: 'work', time: times[i] || '10:00' });
                });
                setTasksAddedDate(today);
                notify('🔐 Cyber tasks added!', phaseColor);
              }}>
                + ADD TODAY'S CYBER TASKS
              </button>
            </div>
          ) : (
            tasks.filter(t => t.category === 'work' && t.name.startsWith('🔐')).map(task => (
              <div key={task.id} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: '1px solid var(--border)', opacity: task.done ? 0.5 : 1,
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${task.done ? 'var(--green)' : phaseColor}`,
                  background: task.done ? 'var(--green)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#000',
                }}>{task.done ? '✓' : ''}</div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'var(--text-primary)', flex: 1, textDecoration: task.done ? 'line-through' : 'none' }}>{task.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)' }}>{task.time}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
});

// ── MAIN APP ──────────────────────────────────────────────────────

export default function Dashboard() {
  const [now, setNow] = useState<Date | null>(null);
  const app = useAppState(now);
  const [activeNav, setActiveNav] = useLocalStorage<NavSection>('cybersched-nav', 'dashboard');
  const [aiSchedule, setAiSchedule] = useLocalStorage<any>('cybersched-ai-schedule', null);
  const [showAddTask, setShowAddTask] = useState(false);

  const db = useSupabaseSync();

  // Load from Supabase on first mount
  useEffect(() => {
    if (!db.userId) return;
    async function loadFromCloud() {
      const [cloudTasks, cloudHabits, cloudSettings, cloudSchedule] = await Promise.all([
        db.loadTasks(),
        db.loadHabits(),
        db.loadSettings(),
        db.loadSchedule(),
      ]);

      if (cloudTasks.length > 0) app.setTasksRaw(cloudTasks);
      if (cloudHabits.length > 0) app.setHabitsRaw(cloudHabits);
      if (cloudSettings) {
        app.setSettings({
          name: cloudSettings.name,
          cigarettesPerDay: cloudSettings.cigarettes_per_day,
          costPerPack: cloudSettings.cost_per_pack,
          cigarettesPerPack: cloudSettings.cigarettes_per_pack,
          currency: cloudSettings.currency,
          goals: cloudSettings.goals || '',
        });
        app.setQuitDate(cloudSettings.quit_date || '');
      }
      if (cloudSchedule) setAiSchedule(cloudSchedule);
    }
    loadFromCloud();
  }, [db.userId]);

  // Auto-sync to Supabase whenever data changes
  useEffect(() => {
    if (!db.userId || app.tasks.length === 0) return;
    const timer = setTimeout(() => db.syncTasks(app.tasks), 2000);
    return () => clearTimeout(timer);
  }, [app.tasks, db.userId]);

  useEffect(() => {
    if (!db.userId) return;
    const timer = setTimeout(() => db.syncHabits(app.habits), 2000);
    return () => clearTimeout(timer);
  }, [app.habits, db.userId]);

  useEffect(() => {
    if (!db.userId) return;
    const timer = setTimeout(() => db.syncSettings(app.settings as any, app.quitDate), 2000);
    return () => clearTimeout(timer);
  }, [app.settings, app.quitDate, db.userId]);

  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Auto-refresh at midnight - clears done tasks and adds new day
  const { setTasksRaw, setHabitsRaw, notify: appNotify } = app;
  const [lastActiveDate, setLastActiveDate] = useLocalStorage<string>('cs-last-active-date', '');
  useEffect(() => {
    const checkMidnight = () => {
      const today = new Date().toISOString().split('T')[0];

      if (lastActiveDate && lastActiveDate !== today) {
        // New day detected
        // 1 — Clear yesterday's completed tasks
        setTasksRaw(prev => prev.filter((t: Task) => !t.done));

        // 2 — Reset habit todayDone flags for new day
        setHabitsRaw(prev => prev.map((h: Habit) => ({ ...h, todayDone: false })));

        // 3 — Notify user
        appNotify('🌅 New day started — habits reset, completed tasks cleared!', 'var(--cyan)');
      }

      setLastActiveDate(today);
    };

    // Check immediately on load
    checkMidnight();

    // Then check every minute
    const interval = setInterval(checkMidnight, 60000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastActiveDate]);

  const {
    tasks, habits, habitsWithProgress,
    settings, quitDate, smokeStats,
    unlockedAchievements, unlockedBadges,
    currentTodayStr, completedToday, totalToday, completionPct,
    addTask, completeTask, toggleHabit, notify
  } = app;

  const displayTime = now ? now.toTimeString().slice(0, 8) : '--:--:--';
  const displayDay = now ? DAYS[now.getDay()] : '';
  const displayMonth = now ? MONTHS[now.getMonth()] : '';
  const displayDate = now ? now.getDate() : '';
  const displayYear = now ? now.getFullYear() : '';

  // Gamification calculations
  // Memoized to prevent recalculation on every clock tick (per-second re-renders)
  const dailyScore = useMemo(() => calculateDailyPoints(
    completedToday,
    habitsWithProgress.filter((h: any) => h.todayDone).length,
    habitsWithProgress.filter((h: any) => h.streak > 0).length
  ), [completedToday, habitsWithProgress]);

  const bestStreak = useMemo(() =>
    habitsWithProgress.length > 0 ? Math.max(...habitsWithProgress.map((h: any) => h.streak)) : 0,
    [habitsWithProgress]
  );

  const weeklyScore = useMemo(() => {
    const weeklyStats = { completed: completedToday, total: totalToday || 1 };
    return weeklyStats.completed + bestStreak * 25 + (habitsWithProgress.filter((h: any) => h.weekProgress > 50).length * 50);
  }, [completedToday, totalToday, bestStreak, habitsWithProgress]);

  // Calendar dates only need to be recalculated when the day changes
  const weekDates = useMemo(() => getWeekDates(now), [currentTodayStr]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', position: 'relative', zIndex: 1 }}>

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="sidebar-logo">CS<span>:SCHED</span></div>
        {NAV_ITEMS.map(nav => (
          <button key={nav.id} className={`nav-item ${activeNav === nav.id ? 'active' : ''}`} onClick={() => setActiveNav(nav.id)}>
            <span className="nav-icon">{nav.icon}</span>
            <span className="nav-label">{nav.label}</span>
          </button>
        ))}

        {/* Sync Status Indicator */}
        <div style={{
          position: 'fixed', bottom: 90, left: 0, width: 72,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          zIndex: 10
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: db.syncError ? 'var(--red)' : db.syncing ? 'var(--orange)' : 'var(--green)',
            boxShadow: `0 0 8px ${db.syncError ? 'var(--red)' : db.syncing ? 'var(--orange)' : 'var(--green)'}`,
            animation: db.syncing ? 'blink 1s infinite' : 'none',
          }} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--text-muted)', textAlign: 'center' }}>
            {db.syncing ? 'SYNC' : db.syncError ? 'OFF' : db.lastSync || 'OK'}
          </div>
        </div>
      </nav>

      {/* MAIN CONTENT */}
      <main style={{ marginLeft: 72, flex: 1, padding: 32, maxWidth: 'calc(100vw - 72px)', minWidth: 0 }}>

        {/* ── DASHBOARD ── */}
        {activeNav === 'dashboard' && (
          <>
            <div className="header">
              <div>
                <div className="header-title">CyberSched // Life OS</div>
                <div className="header-greeting">Welcome back, <span className="cursor-blink">{settings.name}</span></div>
                <div className="header-date">
                  {displayDay.toUpperCase()} · {displayMonth} {displayDate}, {displayYear} ·{' '}
                  <span style={{ color: 'var(--cyan)', fontFamily: 'var(--font-mono)' }}>{displayTime}</span>
                </div>
              </div>
              <div className="header-right">
                <div className="streak-badge">🔥 {habitsWithProgress[0]?.streak || 0} day streak</div>
                <div className="streak-badge" style={{ color: 'var(--green)', boxShadow: '0 0 20px rgba(0,255,136,0.1)' }}>🚭 {smokeStats.days} days clean</div>
              </div>
            </div>

            <div className="stats-grid">
              {[
                { label: "Today's Score", value: `${completionPct}%`, sub: `${completedToday}/${totalToday} tasks done`, icon: '◈', accent: 'var(--cyan)' },
                { label: 'Smoke Free', value: `${smokeStats.days}d`, sub: `≈ $${smokeStats.moneySaved} saved`, icon: '🚭', accent: 'var(--green)' },
                { label: 'Gym Streak', value: `${habitsWithProgress[0]?.streak || 0}`, sub: 'days consecutive', icon: '💪', accent: 'var(--orange)' },
                { label: 'Study Streak', value: `${habitsWithProgress[1]?.streak || 0}`, sub: 'days consecutive', icon: '📚', accent: 'var(--purple)' },
              ].map((stat, i) => (
                <div key={i} className="stat-card" style={{ '--accent-color': stat.accent } as React.CSSProperties}>
                  <div className="stat-label">{stat.label}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-sub">{stat.sub}</div>
                  <div className="stat-icon">{stat.icon}</div>
                </div>
              ))}
            </div>

            <div className="content-grid">
              <div className="content-left">
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">// Habit Core</div>
                    <span className="card-action">Week {Math.ceil((now?.getDate() ?? 1) / 7)}</span>
                  </div>
                  <div className="habits-grid">
                    {habitsWithProgress.map((habit: any) => (
                      <div key={habit.id} className="habit-item" onClick={() => toggleHabit(habit.id)}>
                        <div className="habit-ring">
                          <HabitRing progress={habit.todayDone ? 100 : habit.weekProgress} color={habit.color} />
                          <div className="habit-ring-value" style={{ color: habit.color }}>{habit.todayDone ? '✓' : `${habit.weekProgress}%`}</div>
                        </div>
                        <div className="habit-label" style={{ color: habit.todayDone ? habit.color : undefined }}>{habit.icon} {habit.label}</div>
                        <div className="habit-streak">🔥 {habit.streak}d</div>
                      </div>
                    ))}
                  </div>
                  <div className="progress-bar" style={{ marginTop: 16 }}>
                    <div className="progress-fill" style={{ width: `${completionPct}%`, background: 'linear-gradient(90deg, var(--cyan), var(--green))' }} />
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-secondary)', marginTop: 6 }}>Daily completion: {completionPct}%</div>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">{"// Today's Mission"}</div>
                    <button className="card-action" onClick={() => setShowAddTask(true)}>+ ADD TASK</button>
                  </div>
                  {tasks.filter((t: any) => t.date === currentTodayStr || (currentTodayStr === '' && t.date === '')).sort((a: any, b: any) => a.time.localeCompare(b.time)).map((task: any) => (
                    <div key={task.id} className={`task-item ${task.done ? 'done' : ''}`} onClick={() => completeTask(task.id)}>
                      <div className={`task-check ${task.done ? 'done' : ''}`}>{task.done ? '✓' : ''}</div>
                      <div className="task-info">
                        <div className="task-name">{task.name}</div>
                        <div className="task-meta">
                          <span>{task.time}</span>
                          <span className={`task-tag tag-${task.category}`}>{CATEGORY_LABELS[task.category as Category]}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button className="add-task-btn" onClick={() => setShowAddTask(true)}>
                    <span style={{ fontSize: 18, color: 'var(--cyan)' }}>+</span> Add new task...
                  </button>
                </div>

                <div className="card">
                  <div className="card-header">
                    <div className="card-title">// Weekly Command Grid</div>
                    <span className="card-action">AI-Generated</span>
                  </div>
                  <div className="week-grid">
                    {weekDates ? weekDates.map((date, i) => (
                      <div key={i} className="day-col">
                        <div className="day-header">
                          <div className="day-name">{DAYS[date.getDay()]}</div>
                          <div className={`day-num ${now && date.getDay() === now.getDay() && date.getDate() === now.getDate() ? 'today' : ''}`}>{date.getDate()}</div>
                        </div>
                        {(WEEK_SCHEDULE[i] || []).map((block, j) => (
                          <div key={j} className="day-block" style={{ background: block.bg, color: block.color, border: `1px solid ${block.color}30` }}>{block.label}</div>
                        ))}
                      </div>
                    )) : (
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', padding: 16 }}>Loading schedule...</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="content-right">
                <AISummaryCard
                  tasks={tasks}
                  habits={habitsWithProgress}
                  smokeDays={smokeStats.days}
                />

                <AIMotivationCard
                  settings={settings}
                  smokeStats={smokeStats}
                  gymStreak={habitsWithProgress[0]?.streak || 0}
                  completionPct={completionPct}
                  goals=""
                />

                <PomodoroTimer />

                <QuitCounterCard
                  quitDate={quitDate}
                  setQuitDate={app.setQuitDate}
                  smokeStats={smokeStats}
                />

                <GamificationPanel
                  tasksCompleted={completedToday}
                  habitsCompleted={habitsWithProgress.filter((h: any) => h.todayDone).length}
                  dailyScore={dailyScore}
                  weeklyScore={weeklyScore}
                  currentStreak={bestStreak}
                  unlockedAchievements={unlockedAchievements}
                  unlockedBadges={BADGES.filter((b: any) => unlockedBadges.includes(b.id))}
                />

                <div className="card" style={{ border: '1px solid var(--green-glow)' }}>
                  <div className="card-header">
                    <div className="card-title" style={{ color: 'var(--green)' }}>// German Progress</div>
                  </div>
                  <div style={{ padding: '4px 0' }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 8 }}>MONTH {GERMAN_ROADMAP[0].month}: {GERMAN_ROADMAP[0].title.toUpperCase()}</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>{GERMAN_ROADMAP[0].phase} Phase</div>
                    <div className="progress-bar" style={{ height: 6 }}>
                      <div className="progress-fill" style={{ width: '0%', background: 'var(--green)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                      <span>LEVEL: {GERMAN_ROADMAP[0].level}</span>
                      <span>0 / {GERMAN_ROADMAP[0].targetWords} WORDS</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeNav === 'tasks' && <TasksSection tasks={tasks} setTasks={app.setTasksRaw} currentTodayStr={currentTodayStr} />}
        {activeNav === 'habits' && <HabitsSection habits={habitsWithProgress} setHabits={app.setHabitsRaw} toggleHabit={toggleHabit} />}
        {activeNav === 'stats' && <StatsSection tasks={tasks} habits={habitsWithProgress} quitDate={quitDate} setQuitDate={app.setQuitDate} smokeStats={smokeStats} />}
        {activeNav === 'planner' && <PlannerSection addTask={addTask} notify={notify} aiSchedule={aiSchedule} setAiSchedule={setAiSchedule} />}
        {activeNav === 'analytics' && <AnalyticsSection tasks={tasks} habits={habitsWithProgress} settings={settings} smokeStats={smokeStats} />}
        {activeNav === 'german' && <GermanSection tasks={tasks} addTask={addTask} notify={notify} />}
        {activeNav === 'cyber' && (
          <CyberSection
            tasks={tasks}
            addTask={addTask}
            notify={notify}
          />
        )}
        {activeNav === 'settings' && <SettingsSection settings={settings} setSettings={app.setSettings} tasks={tasks} setTasks={app.setTasksRaw} habits={habitsWithProgress} setHabits={app.setHabitsRaw} quitDate={quitDate} setQuitDate={app.setQuitDate} userId={db.userId} notify={notify} />}
      </main>

      <AIChatController
        tasks={tasks}
        setTasks={app.setTasksRaw}
        habits={habitsWithProgress}
        setHabits={app.setHabitsRaw}
        settings={settings}
        setSettings={app.setSettings}
        quitDate={quitDate}
        setQuitDate={app.setQuitDate}
        setActiveNav={setActiveNav}
        currentTodayStr={currentTodayStr}
        notify={notify}
        addTask={addTask}
        completeTask={completeTask}
        deleteTask={app.deleteTask}
        toggleHabit={toggleHabit}
        aiSchedule={aiSchedule}
        syncSchedule={db.syncSchedule}
        loadSchedule={db.loadSchedule}
        saveAIMessage={db.saveAIMessage}
        loadAIMemory={db.loadAIMemory}
        userId={db.userId}
      />

      {/* ADD TASK MODAL */}
      {showAddTask && (
        <div className="modal-overlay" onClick={() => setShowAddTask(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="card-header" style={{ marginBottom: 16 }}>
              <div className="card-title">// Create Advanced Task</div>
            </div>
            <AdvancedTaskForm onSubmit={(data: any) => { addTask(data); setShowAddTask(false); }} onCancel={() => setShowAddTask(false)} />
          </div>
        </div>
      )}


      <NotificationToast notifications={app.notifications} />

      <NotificationCenter tasks={tasks} habits={habitsWithProgress} settings={settings} />
    </div>
  );
}
