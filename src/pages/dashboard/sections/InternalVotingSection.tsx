import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Smile,
  Trash2,
  Vote,
  X,
} from 'lucide-react';
import { ROLE_LEVELS } from '@/types';
import { formatStaffDisplayName } from '@/utils/formatters';
import { BULAN_INDO } from '../constants';
import type { PortalStaffMember } from '../types';

export interface NormalizedPollItem {
  id: string;
  question: string;
  description?: string;
  options: Array<{ id: string; label: string; count: number }>;
  allowMultiple: boolean;
  deadline: string;
  totalVotes: number;
  mySelectedLabels: string[];
  raw?: unknown;
}

interface InternalVotingSectionProps {
  currentUser?: PortalStaffMember | null;
  polls?: unknown[];
  votings?: unknown[];
  votingList?: unknown[];
  canCreatePoll?: boolean;
  canManage?: boolean;
  canCreate?: boolean;
  isHrdOrAbove?: boolean;
  onCreatePoll?: (payload: any) => Promise<boolean | void> | boolean | void;
  onCreateVoting?: (payload: any) => Promise<boolean | void> | boolean | void;
  onAddVoting?: (payload: any) => Promise<boolean | void> | boolean | void;
  onCastVote?: (pollId: string, option: any) => Promise<boolean | void> | boolean | void;
  onVote?: (pollId: string, option: any) => Promise<boolean | void> | boolean | void;
  onNotify?: (msg: string) => void;
  [key: string]: unknown;
}

const HARI_SINGKAT = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

const DURATION_PRESETS = [
  { id: '24h', label: '24 jam', hours: 24 },
  { id: '3d', label: '3 hari', hours: 72 },
  { id: '7d', label: '1 minggu', hours: 168 },
  { id: 'custom', label: 'Custom tanggal & waktu', hours: null },
] as const;

const PETINGGI_ROLES = [
  'human resources department',
  'secretary & treasurer',
  'secretary and treasurer',
  'deputy director',
  'director',
  'hospital comitee',
  'hospital committee',
] as const;

function asRecord(val: unknown): Record<string, unknown> {
  return val && typeof val === 'object' ? (val as Record<string, unknown>) : {};
}

function extractNumericLevel(val: unknown): number {
  if (typeof val === 'number' && Number.isFinite(val)) return val;
  if (typeof val === 'string') {
    const match = /(?:lv\.?|level\s*)(\d+)/i.exec(val) ?? /^(\d+)$/.exec(val.trim());
    if (match) return Number(match[1]);
  }
  return 0;
}

function checkIsPetinggi(user?: PortalStaffMember | null): boolean {
  if (!user) return false;
  const rec = asRecord(user);

  const roleCandidates = [
    user.role,
    rec.roleName,
    rec.staffRole,
    rec.jabatan,
    rec.rank,
    rec.roleId,
    rec.roleKey,
  ]
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);

  for (const r of roleCandidates) {
    const mapped =
      (ROLE_LEVELS as Record<string, number | undefined>)[r] ??
      (ROLE_LEVELS as Record<string, number | undefined>)[r.toLowerCase()];
    if (typeof mapped === 'number' && mapped >= 8) {
      return true;
    }
    if (extractNumericLevel(r) >= 8) {
      return true;
    }
  }

  const extraLevel = Math.max(extractNumericLevel(rec.roleLevel), extractNumericLevel(rec.level));
  if (extraLevel >= 8) return true;

  const combined = roleCandidates.join(' ').toLowerCase();
  return PETINGGI_ROLES.some((p) => combined.includes(p));
}

function toYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addHoursToDate(base: Date, hours: number): Date {
  return new Date(base.getTime() + hours * 60 * 60 * 1000);
}

function formatDateIndoShort(ymd: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(ymd);
  if (!match) return ymd;
  const year = Number(match[1]);
  const monthIdx = Math.max(0, Math.min(11, Number(match[2]) - 1));
  const day = Number(match[3]);
  return `${day} ${BULAN_INDO[monthIdx]} ${year}`;
}

function normalizePoll(raw: unknown, index: number, userUid: string): NormalizedPollItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = asRecord(raw);

  const id = String(r.id ?? r.uid ?? `poll-${index}`);
  const question = String(r.question ?? r.judul ?? r.title ?? r.pertanyaan ?? 'Voting Internal');
  const descriptionRaw = r.description ?? r.deskripsi ?? r.catatan ?? '';
  const description =
    typeof descriptionRaw === 'string' && descriptionRaw.trim() ? descriptionRaw : undefined;
  const deadline = String(r.deadline ?? r.batasWaktu ?? r.endDate ?? r.expiredAt ?? '2026-11-30');
  const allowMultiple = Boolean(r.allowMultiple ?? r.multiple ?? false);

  const rawOptions = Array.isArray(r.options)
    ? r.options
    : Array.isArray(r.opsi)
      ? r.opsi
      : Array.isArray(r.pilihan)
        ? r.pilihan
        : [];

  const votesByUser =
    r.votesByUser && typeof r.votesByUser === 'object'
      ? (r.votesByUser as Record<string, string[]>)
      : {};
  const votersMap =
    r.voters && typeof r.voters === 'object' ? (r.voters as Record<string, string>) : {};
  const votesCountMap =
    r.votes && typeof r.votes === 'object' && !Array.isArray(r.votes)
      ? (r.votes as Record<string, number>)
      : {};

  const options = rawOptions
    .map((opt, optIdx) => {
      if (typeof opt === 'string') {
        const countFromMap =
          typeof votesCountMap[opt] === 'number'
            ? votesCountMap[opt]
            : Object.values(votesByUser).filter((arr) => Array.isArray(arr) && arr.includes(opt))
                .length + Object.values(votersMap).filter((v) => v === opt).length;
        return {
          id: `${id}-opt-${optIdx}`,
          label: opt,
          count: countFromMap,
        };
      }
      if (opt && typeof opt === 'object') {
        const o = asRecord(opt);
        const label = String(o.label ?? o.text ?? o.nama ?? o.opsi ?? `Opsi ${optIdx + 1}`);
        const optId = String(o.id ?? `${id}-opt-${optIdx}`);
        const count =
          typeof o.votes === 'number'
            ? o.votes
            : typeof o.count === 'number'
              ? o.count
              : Array.isArray(o.voters)
                ? o.voters.length
                : typeof votesCountMap[optId] === 'number'
                  ? votesCountMap[optId]
                  : typeof votesCountMap[label] === 'number'
                    ? votesCountMap[label]
                    : 0;
        return {
          id: optId,
          label,
          count,
        };
      }
      return null;
    })
    .filter((x): x is { id: string; label: string; count: number } => Boolean(x));

  const mySelectedLabels: string[] = [];
  if (userUid) {
    if (Array.isArray(votesByUser[userUid])) {
      mySelectedLabels.push(...votesByUser[userUid]);
    }
    if (typeof votersMap[userUid] === 'string') {
      const val = votersMap[userUid];
      const matchedOpt = options.find((o) => o.id === val || o.label === val);
      mySelectedLabels.push(matchedOpt ? matchedOpt.label : val);
    }
  }

  const totalVotes =
    typeof r.totalVotes === 'number'
      ? r.totalVotes
      : options.reduce((acc, item) => acc + item.count, 0);

  return {
    id,
    question,
    description,
    options,
    allowMultiple,
    deadline,
    totalVotes,
    mySelectedLabels,
    raw,
  };
}

interface CustomDeadlinePickerProps {
  valueDate: string;
  valueTime: string;
  onChangeDate: (ymd: string) => void;
  onChangeTime: (hhmm: string) => void;
  onSelectDurationPreset?: (presetId: string) => void;
}

function CustomDeadlinePicker({
  valueDate,
  valueTime,
  onChangeDate,
  onChangeTime,
  onSelectDurationPreset,
}: CustomDeadlinePickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const parsedDate = useMemo(() => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(valueDate);
    if (m) {
      return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    }
    return new Date(2026, 10, 30);
  }, [valueDate]);

  const [viewYear, setViewYear] = useState<number>(parsedDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(parsedDate.getMonth());

  useEffect(() => {
    setViewYear(parsedDate.getFullYear());
    setViewMonth(parsedDate.getMonth());
  }, [parsedDate]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; ymd: string | null }> = [];

    for (let i = 0; i < firstDayOfMonth; i += 1) {
      cells.push({ day: null, ymd: null });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const ymd = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, ymd });
    }
    return cells;
  }, [viewYear, viewMonth]);

  const handleStepMonth = (delta: number) => {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  };

  const applyQuickOffset = (daysToAdd: number) => {
    const base = new Date();
    const target = new Date(base.getFullYear(), base.getMonth(), base.getDate() + daysToAdd);
    onChangeDate(toYmd(target));
    setViewYear(target.getFullYear());
    setViewMonth(target.getMonth());
    onSelectDurationPreset?.('custom');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-10 w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-left text-xs font-semibold text-slate-800 transition hover:border-[#8B1515] focus:border-[#8B1515] focus:outline-none"
      >
        <span className="inline-flex items-center gap-2 truncate">
          <CalendarIcon className="h-3.5 w-3.5 shrink-0 text-[#8B1515]" />
          <span>{formatDateIndoShort(valueDate)}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-slate-600">
            <Clock className="h-3 w-3 text-slate-400" />
            {valueTime} WIB
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${
            open ? 'rotate-180 text-[#8B1515]' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 z-30 mt-2 w-80 max-w-[90vw] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
          <div className="flex flex-wrap items-center gap-1.5 pb-3">
            {[
              { label: 'Besok', days: 1 },
              { label: '+3 Hari', days: 3 },
              { label: '+7 Hari', days: 7 },
              { label: '+14 Hari', days: 14 },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={() => applyQuickOffset(chip.days)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#8B1515]"
              >
                {chip.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => handleStepMonth(-1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Bulan sebelumnya"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-heading text-xs font-extrabold text-slate-900">
              {BULAN_INDO[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={() => handleStepMonth(1)}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              aria-label="Bulan berikutnya"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-2.5 grid grid-cols-7 gap-1 text-center text-[10px] font-extrabold uppercase text-slate-400">
            {HARI_SINGKAT.map((h) => (
              <span key={h} className="py-1">
                {h}
              </span>
            ))}
          </div>

          <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
            {calendarDays.map((cell, idx) => {
              if (!cell.day || !cell.ymd) {
                return <span key={`empty-${idx}`} className="h-8" />;
              }
              const isSelected = cell.ymd === valueDate;
              return (
                <button
                  key={cell.ymd}
                  type="button"
                  onClick={() => {
                    onChangeDate(cell.ymd!);
                    onSelectDurationPreset?.('custom');
                  }}
                  className={`flex h-8 w-full items-center justify-center rounded-lg font-mono text-xs font-bold transition ${
                    isSelected
                      ? 'bg-[#8B1515] text-white shadow-2xs'
                      : 'text-slate-700 hover:bg-rose-50 hover:text-[#8B1515]'
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs">
            <span className="font-bold text-slate-600">Jam Batas:</span>
            <div className="flex items-center gap-1.5">
              {['12:00', '18:00', '21:00', '23:59'].map((presetTime) => (
                <button
                  key={presetTime}
                  type="button"
                  onClick={() => onChangeTime(presetTime)}
                  className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold transition ${
                    valueTime === presetTime
                      ? 'bg-[#8B1515] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {presetTime}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between gap-2">
            <input
              type="time"
              value={valueTime}
              onChange={(e) => onChangeTime(e.target.value || '23:59')}
              className="h-8 rounded-lg border border-slate-200 px-2.5 font-mono text-xs text-slate-700 focus:border-[#8B1515] focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-[#8B1515] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#6E0F0F]"
            >
              Terapkan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const FALLBACK_POLLS: NormalizedPollItem[] = [
  {
    id: 'poll-briefing-mingguan',
    question: 'Penjadwalan Briefing Operasional Mingguan',
    description: 'Pemilihan slot waktu briefing rutin seluruh divisi RS KotaBaru.',
    options: [
      { id: 'opt-1', label: 'Senin · 19:00 WIB', count: 9 },
      { id: 'opt-2', label: 'Rabu · 20:00 WIB', count: 7 },
      { id: 'opt-3', label: 'Jumat · 19:30 WIB', count: 4 },
    ],
    allowMultiple: false,
    deadline: '2026-11-30',
    totalVotes: 20,
    mySelectedLabels: [],
  },
];

export function InternalVotingSection(props: InternalVotingSectionProps) {
  const {
    currentUser,
    polls,
    votings,
    votingList,
    canCreatePoll,
    canManage,
    canCreate,
    isHrdOrAbove,
    onCreatePoll,
    onCreateVoting,
    onAddVoting,
    onCastVote,
    onVote,
    onNotify,
  } = props;

  const canCreateVote = useMemo(() => {
    if (
      canCreatePoll === false ||
      canManage === false ||
      canCreate === false ||
      isHrdOrAbove === false
    ) {
      return false;
    }
    return checkIsPetinggi(currentUser);
  }, [currentUser, canCreatePoll, canManage, canCreate, isHrdOrAbove]);

  const userUid = currentUser?.uid ?? 'guest-staff';

  const incomingList = useMemo(() => {
    const rawArr = Array.isArray(polls)
      ? polls
      : Array.isArray(votings)
        ? votings
        : Array.isArray(votingList)
          ? votingList
          : null;

    if (!rawArr) return null;
    return rawArr
      .map((item, idx) => normalizePoll(item, idx, userUid))
      .filter((x): x is NormalizedPollItem => Boolean(x));
  }, [polls, votings, votingList, userUid]);

  const initialDefaultDate = useMemo(() => toYmd(addHoursToDate(new Date(), 24)), []);

  const [isFormDropdownOpen, setIsFormDropdownOpen] = useState(false);

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [answers, setAnswers] = useState<string[]>(['', '']);
  const [durationPreset, setDurationPreset] = useState<string>('24h');
  const [deadlineDate, setDeadlineDate] = useState<string>(initialDefaultDate);
  const [deadlineTime, setDeadlineTime] = useState<string>('23:59');
  const [allowMultiple, setAllowMultiple] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [localPolls, setLocalPolls] = useState<NormalizedPollItem[]>(
    incomingList ?? FALLBACK_POLLS
  );

  useEffect(() => {
    if (incomingList) {
      setLocalPolls(incomingList);
    }
  }, [incomingList]);

  useEffect(() => {
    if (!canCreateVote) {
      setIsFormDropdownOpen(false);
    }
  }, [canCreateVote, currentUser]);

  const notify = (msg: string) => {
    if (onNotify) {
      onNotify(msg);
    }
  };

  const handleToggleFormDropdown = () => {
    if (!canCreateVote) {
      setIsFormDropdownOpen(false);
      return;
    }
    setIsFormDropdownOpen((prev) => !prev);
  };

  const handleDurationChange = (presetId: string) => {
    if (!canCreateVote) return;
    setDurationPreset(presetId);
    const found = DURATION_PRESETS.find((p) => p.id === presetId);
    if (found && typeof found.hours === 'number') {
      const target = addHoursToDate(new Date(), found.hours);
      setDeadlineDate(toYmd(target));
      const hh = String(target.getHours()).padStart(2, '0');
      const mm = String(target.getMinutes()).padStart(2, '0');
      setDeadlineTime(`${hh}:${mm}`);
    }
  };

  const handleAnswerChange = (index: number, val: string) => {
    if (!canCreateVote) return;
    setAnswers((prev) => prev.map((item, idx) => (idx === index ? val : item)));
  };

  const handleAddAnswer = () => {
    if (!canCreateVote) return;
    if (answers.length >= 10) {
      notify('Maksimal 10 pilihan jawaban dalam satu voting.');
      return;
    }
    setAnswers((prev) => [...prev, '']);
  };

  const handleRemoveAnswer = (index: number) => {
    if (!canCreateVote) return;
    if (answers.length <= 2) {
      notify('Minimal diperlukan 2 pilihan jawaban.');
      return;
    }
    setAnswers((prev) => prev.filter((_, idx) => idx !== index));
  };

  const resetForm = () => {
    setQuestion('');
    setDescription('');
    setAnswers(['', '']);
    setDurationPreset('24h');
    setDeadlineDate(toYmd(addHoursToDate(new Date(), 24)));
    setDeadlineTime('23:59');
    setAllowMultiple(false);
  };

  const nonEmptyAnswers = answers.map((a) => a.trim()).filter((a) => a.length > 0);

  const isFormValid =
    canCreateVote &&
    question.trim().length > 0 &&
    nonEmptyAnswers.length >= 2 &&
    deadlineDate.trim().length > 0;

  const handleSubmitPoll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreateVote) {
      setIsFormDropdownOpen(false);
      return;
    }
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const createHandler = onCreatePoll ?? onCreateVoting ?? onAddVoting;
      const authorName = currentUser ? formatStaffDisplayName(currentUser) : 'Petinggi RSKB';

      if (createHandler) {
        const res = await createHandler({
          question: question.trim(),
          judul: question.trim(),
          title: question.trim(),
          description: description.trim(),
          deskripsi: description.trim(),
          options: nonEmptyAnswers,
          opsi: nonEmptyAnswers,
          allowMultiple,
          deadline: deadlineDate,
          deadlineDate,
          deadlineTime,
          durationPreset,
          createdBy: authorName,
        });
        if (res === false) return;
      }

      const createdItem: NormalizedPollItem = {
        id: `poll-${Date.now()}`,
        question: question.trim(),
        description: description.trim() || undefined,
        options: nonEmptyAnswers.map((label, idx) => ({
          id: `opt-${Date.now()}-${idx}`,
          label,
          count: 0,
        })),
        allowMultiple,
        deadline: deadlineDate,
        totalVotes: 0,
        mySelectedLabels: [],
      };

      setLocalPolls((prev) => [createdItem, ...prev]);
      resetForm();
      setIsFormDropdownOpen(false);
      notify('Voting internal baru berhasil diterbitkan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleOption = async (poll: NormalizedPollItem, opt: { id: string; label: string }) => {
    const alreadySelected = poll.mySelectedLabels.includes(opt.label);
    let nextLabels: string[];

    if (poll.allowMultiple) {
      nextLabels = alreadySelected
        ? poll.mySelectedLabels.filter((x) => x !== opt.label)
        : [...poll.mySelectedLabels, opt.label];
    } else {
      nextLabels = alreadySelected ? [] : [opt.label];
    }

    const voteHandler = onCastVote ?? onVote;
    if (voteHandler) {
      await voteHandler(poll.id, poll.allowMultiple ? nextLabels : opt.id || opt.label);
    }

    setLocalPolls((prev) =>
      prev.map((item) => {
        if (item.id !== poll.id) return item;

        const updatedOptions = item.options.map((o) => {
          const wasPicked = item.mySelectedLabels.includes(o.label);
          const nowPicked = nextLabels.includes(o.label);
          let nextCount = o.count;
          if (!wasPicked && nowPicked) nextCount += 1;
          if (wasPicked && !nowPicked) nextCount = Math.max(0, nextCount - 1);
          return { ...o, count: nextCount };
        });

        return {
          ...item,
          options: updatedOptions,
          mySelectedLabels: nextLabels,
          totalVotes: updatedOptions.reduce((sum, o) => sum + o.count, 0),
        };
      })
    );
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">
              Voting & Jajak Pendapat Internal
            </h2>
            <p className="text-xs text-slate-500">
              Satu staff hanya dapat memberikan suara pada setiap pemungutan suara · Pembuatan vote khusus petinggi
            </p>
          </div>

          {canCreateVote && (
            <button
              type="button"
              onClick={handleToggleFormDropdown}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#8B1515] px-4 text-xs font-extrabold text-white shadow-2xs transition hover:bg-[#6E0F0F]"
            >
              {isFormDropdownOpen ? (
                <>
                  <X className="h-4 w-4" />
                  <span>Tutup Form Voting</span>
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4" />
                  <span>Buat Voting Baru (Petinggi)</span>
                  <ChevronDown className="h-3.5 w-3.5 opacity-85" />
                </>
              )}
            </button>
          )}
        </div>
      </section>

      {canCreateVote && isFormDropdownOpen && (
        <section className="rounded-2xl border border-rose-200/90 bg-white p-6 shadow-md">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[#8B1515]">
                <Vote className="h-4 w-4" />
              </div>
              <div>
                <h3 className="font-heading text-base font-extrabold text-slate-900">
                  Buat Voting Baru
                </h3>
                <p className="text-[11px] text-slate-500">
                  Susun pertanyaan, pilihan jawaban, dan batas waktu pemungutan suara.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsFormDropdownOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              aria-label="Tutup form voting"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSubmitPoll} className="mt-5 space-y-5 text-xs">
            <div>
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label className="font-bold text-slate-800">
                  Pertanyaan Voting <span className="text-[#8B1515]">*</span>
                </label>
                <span className="font-mono text-[11px] text-slate-400">
                  {question.length} / 300
                </span>
              </div>
              <input
                type="text"
                maxLength={300}
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Pertanyaan apa yang ingin Anda ajukan?"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1.5 block font-bold text-slate-800">
                Catatan / Deskripsi Singkat
              </label>
              <input
                type="text"
                maxLength={180}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opsional: jelaskan konteks atau aturan pemungutan suara..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none"
              />
            </div>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  Pilihan Jawaban <span className="text-[#8B1515]">*</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  Minimal 2 opsi ({nonEmptyAnswers.length} terisi)
                </span>
              </div>

              <div className="space-y-2">
                {answers.map((ans, idx) => (
                  <div key={`answer-${idx}`} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Smile className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        maxLength={100}
                        value={ans}
                        onChange={(e) => handleAnswerChange(idx, e.target.value)}
                        placeholder={`Ketik jawaban ke-${idx + 1}...`}
                        className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#8B1515] focus:outline-none"
                      />
                    </div>

                    <button
                      type="button"
                      disabled={answers.length <= 2}
                      onClick={() => handleRemoveAnswer(idx)}
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:border-rose-200 hover:bg-rose-50 hover:text-[#8B1515] disabled:cursor-not-allowed disabled:opacity-40"
                      title="Hapus pilihan jawaban"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={handleAddAnswer}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50/60 hover:text-[#8B1515]"
                >
                  <Plus className="h-3.5 w-3.5 text-[#8B1515]" />
                  <span>Tambah Jawaban</span>
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block font-bold text-slate-800">Durasi Voting</label>
                <div className="relative">
                  <select
                    value={durationPreset}
                    onChange={(e) => handleDurationChange(e.target.value)}
                    className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white px-3.5 pr-9 text-xs font-semibold text-slate-800 focus:border-[#8B1515] focus:outline-none"
                  >
                    {DURATION_PRESETS.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="mb-1.5 block font-bold text-slate-800">
                  Batas Waktu (Custom Date Picker) <span className="text-[#8B1515]">*</span>
                </label>
                <CustomDeadlinePicker
                  valueDate={deadlineDate}
                  valueTime={deadlineTime}
                  onChangeDate={setDeadlineDate}
                  onChangeTime={setDeadlineTime}
                  onSelectDurationPreset={setDurationPreset}
                />
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center">
              <label className="inline-flex cursor-pointer items-center gap-2.5 select-none">
                <input
                  type="checkbox"
                  checked={allowMultiple}
                  onChange={(e) => setAllowMultiple(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-[#8B1515]"
                />
                <span className="font-bold text-slate-700">Izinkan Lebih dari Satu Jawaban</span>
              </label>

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormDropdownOpen(false)}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-4 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!isFormValid || isSubmitting}
                  className={`h-10 rounded-xl px-5 text-xs font-extrabold transition ${
                    isFormValid && !isSubmitting
                      ? 'bg-[#8B1515] text-white shadow-2xs hover:bg-[#6E0F0F]'
                      : 'cursor-not-allowed bg-rose-200/80 text-white'
                  }`}
                >
                  {isSubmitting ? 'Menerbitkan...' : 'Terbitkan Voting'}
                </button>
              </div>
            </div>
          </form>
        </section>
      )}

      <div className="space-y-4">
        {localPolls.map((poll) => (
          <section
            key={poll.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-bold text-[#8B1515]">
                Voting Aktif · Batas {poll.deadline}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                {poll.totalVotes} Suara Masuk
              </span>
            </div>

            <h3 className="mt-3 font-heading text-base font-extrabold text-slate-900">
              {poll.question}
            </h3>
            {poll.description && (
              <p className="mt-1 text-xs text-slate-500">{poll.description}</p>
            )}

            <div className="mt-4 space-y-2">
              {poll.options.map((opt) => {
                const pct =
                  poll.totalVotes > 0 ? Math.round((opt.count / poll.totalVotes) * 100) : 0;
                const pickedByMe = poll.mySelectedLabels.includes(opt.label);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleToggleOption(poll, opt)}
                    className={`relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-4 py-2.5 text-left text-xs transition ${
                      pickedByMe
                        ? 'border-[#8B1515] bg-rose-50/50 font-bold text-[#8B1515]'
                        : 'border-slate-200 bg-white font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div
                      className="pointer-events-none absolute inset-y-0 left-0 bg-rose-100/45 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                    <span className="relative z-10 inline-flex items-center gap-2">
                      {pickedByMe && <Check className="h-3.5 w-3.5 text-[#8B1515]" />}
                      <span>{opt.label}</span>
                    </span>
                    <span className="relative z-10 font-mono text-[11px] text-slate-600">
                      {opt.count} suara ({pct}%)
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}