import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, MapPin, Wrench, Award, Save, Edit3, Plus, X } from 'lucide-react';
import { mechanicApi, getErrorMessage } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { toast } from '@/stores/toast-store';
import { LocationPicker, PickedLocation } from '@/components/ui/LocationPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { CardSkeleton, ErrorState } from '@/components/ui/Feedback';
import { initials } from '@/lib/utils';

const SKILL_SUGGESTIONS = [
  'Engine Repair', 'AC Service', 'Brake Specialist', 'Electrical',
  'Body Work', 'General Service', 'Tyre Care', 'Battery', 'Oil Change',
  'Suspension', 'Transmission', 'Exhaust', 'Spare Part Installation',
];

export function MechanicProfile() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [serviceArea, setServiceArea] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');
  const [pickedLocation, setPickedLocation] = useState<PickedLocation | null>(null);
  const [userEditedAddress, setUserEditedAddress] = useState(false);

  const profile = useQuery({
    queryKey: ['my-mechanic', user?.userId],
    queryFn: () => mechanicApi.getByUser(user!.userId),
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => mechanicApi.update(profile.data!.id, data as Parameters<typeof mechanicApi.update>[1]),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-mechanic'] });
      toast('Profile updated successfully', 'success');
      setEditing(false);
    },
    onError: (err) => toast(getErrorMessage(err), 'error'),
  });

  // Sync form state when profile loads or editing starts
  useEffect(() => {
    if (profile.data && editing) {
      setName(user?.name ?? '');
      setPhone(profile.data.phone ?? '');
      setServiceArea(profile.data.serviceArea ?? '');
      setSkills([...profile.data.skills]);
      if (profile.data.latitude && profile.data.longitude) {
        setPickedLocation({
          latitude: profile.data.latitude,
          longitude: profile.data.longitude,
          area: profile.data.serviceArea,
        });
      }
    }
  }, [profile.data, editing, user]);

  // Auto-fill service area from map
  useEffect(() => {
    if (pickedLocation?.area && !userEditedAddress) {
      setServiceArea(pickedLocation.area);
    }
  }, [pickedLocation, userEditedAddress]);

  if (profile.isLoading) return <CardSkeleton count={2} />;
  if (profile.isError || !profile.data) return <ErrorState message="Could not load your profile" />;

  const me = profile.data;

  const addSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills([...skills, trimmed]);
    }
    setNewSkill('');
  };

  const removeSkill = (skill: string) => {
    setSkills(skills.filter((s) => s !== skill));
  };

  const handleSave = () => {
    if (name.trim().length < 2) {
      toast('Name must be at least 2 characters', 'error');
      return;
    }
    if (serviceArea.trim().length < 2) {
      toast('Service area is required', 'error');
      return;
    }
    updateMutation.mutate({
      name: name.trim(),
      phone: phone.trim(),
      serviceArea: serviceArea.trim(),
      skills,
      latitude: pickedLocation?.latitude,
      longitude: pickedLocation?.longitude,
    });
  };

  // ── View mode ──────────────────────────────────────────────────────
  if (!editing) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="card overflow-hidden">
          <div className="h-28 bg-gradient-to-r from-brand-600 via-amber-500 to-brand-700" />
          <div className="px-6 pb-6">
            <div className="-mt-10 mb-4 flex items-end justify-between">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-ink-100 text-lg font-extrabold text-ink-600 dark:border-ink-900 dark:bg-ink-800">
                {initials(user?.name ?? 'M')}
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-2 dark:bg-amber-500/10">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span className="text-lg font-extrabold text-ink-900 dark:text-ink-100">{me.averageRating ? me.averageRating.toFixed(1) : '—'}</span>
                </div>
                <Button onClick={() => setEditing(true)}>
                  <Edit3 className="h-4 w-4" /> Edit Profile
                </Button>
              </div>
            </div>

            <h1 className="text-xl font-extrabold text-ink-900 dark:text-ink-100">{user?.name}</h1>
            <p className="text-sm text-ink-400">{me.email} · {me.phone}</p>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-800/60">
                <MapPin className="h-4 w-4 text-brand-500" /> {me.serviceArea}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-800/60">
                <Wrench className="h-4 w-4 text-brand-500" /> {me.skills.join(', ')}
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-sm dark:bg-ink-800/60">
                <Award className="h-4 w-4 text-brand-500" /> {me.totalJobsCompleted} jobs done
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Edit mode ──────────────────────────────────────────────────────
  return (
    <div className="mx-auto max-w-3xl">
      <div className="card overflow-hidden">
        <div className="h-28 bg-gradient-to-r from-brand-600 via-amber-500 to-brand-700" />
        <div className="px-6 pb-6">
          <div className="-mt-10 mb-4 flex items-end justify-between">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-ink-100 text-lg font-extrabold text-ink-600 dark:border-ink-900 dark:bg-ink-800">
              {initials(user?.name ?? 'M')}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={updateMutation.isPending}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            </div>
          </div>

          <div className="space-y-4">
            <Input label="Name" id="name" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="Phone" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 9876543210" />

            {/* Skills */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Skills</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {skills.map((skill) => (
                  <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 dark:bg-brand-500/15 dark:text-brand-400">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)} className="rounded-full p-0.5 hover:bg-brand-100 dark:hover:bg-brand-500/25">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  className="input flex-1"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(newSkill); } }}
                  placeholder="Add a skill..."
                />
                <Button size="sm" onClick={() => addSkill(newSkill)} disabled={!newSkill.trim()}>
                  <Plus className="h-4 w-4" /> Add
                </Button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {SKILL_SUGGESTIONS.filter((s) => !skills.includes(s)).map((s) => (
                  <button key={s} type="button" onClick={() => addSkill(s)} className="rounded-full border border-ink-200 px-2.5 py-0.5 text-[11px] text-ink-500 transition hover:border-brand-400 hover:text-brand-600 dark:border-ink-700 dark:text-ink-400">
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300">Service Location</label>
              <LocationPicker value={pickedLocation} onChange={setPickedLocation} height="280px" />
            </div>
            <Input label="Service Area" id="serviceArea" value={serviceArea} onChange={(e) => { setServiceArea(e.target.value); setUserEditedAddress(true); }} placeholder="e.g. Koramangala, Bangalore" />
          </div>
        </div>
      </div>
    </div>
  );
}
