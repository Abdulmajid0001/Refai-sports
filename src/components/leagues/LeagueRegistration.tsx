import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Building, Users, CreditCard, FileText, Upload, CheckCircle,
  ChevronRight, ChevronLeft, Shield, DollarSign, Calendar,
  Clock, AlertTriangle, Image, Check
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

type LeagueFormat = '3' | '4' | '5' | '7' | '8' | '9' | '11';
type SubscriptionTier = 'starter' | 'pro' | 'elite';
type BillingCycle = 'monthly' | 'annual' | 'league_duration';

interface LeagueFormData {
  name: string;
  slug: string;
  description: string;
  format: LeagueFormat;
  logo_url: string;
  rules_document_url: string;
  subscription_tier: SubscriptionTier;
  billing_cycle: BillingCycle;
  estimated_teams: number;
  start_date: string;
  end_date: string;
  contact_email: string;
  contact_phone: string;
}

const TIER_DETAILS: Record<SubscriptionTier, {
  max_teams: number;
  price_monthly: number;
  price_annual: number;
  features: string[];
}> = {
  starter: {
    max_teams: 6,
    price_monthly: 29,
    price_annual: 278,
    features: ['Up to 6 teams', 'Basic match management', 'Standard support', '1GB storage'],
  },
  pro: {
    max_teams: 12,
    price_monthly: 79,
    price_annual: 758,
    features: ['Up to 12 teams', 'Advanced analytics', 'Priority support', '50GB storage', 'Custom graphics'],
  },
  elite: {
    max_teams: -1,
    price_monthly: 199,
    price_annual: 1908,
    features: ['Unlimited teams', 'Full AI features', 'Dedicated support', 'Unlimited storage', 'Custom branding', 'API access'],
  },
};

const FORMAT_LABELS: Record<LeagueFormat, string> = {
  '3': '3-a-side',
  '4': '4-a-side',
  '5': '5-a-side',
  '7': '7-a-side',
  '8': '8-a-side',
  '9': '9-a-side',
  '11': '11-a-side (Full)',
};

export function LeagueRegistration() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<LeagueFormData>({
    name: '',
    slug: '',
    description: '',
    format: '11',
    logo_url: '',
    rules_document_url: '',
    subscription_tier: 'starter',
    billing_cycle: 'monthly',
    estimated_teams: 4,
    start_date: '',
    end_date: '',
    contact_email: user?.email || '',
    contact_phone: '',
  });

  // Generate slug from name
  const generateSlug = useCallback((name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }, []);

  // Update form field
  const updateField = <K extends keyof LeagueFormData>(key: K, value: LeagueFormData[K]) => {
    setFormData((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'name') {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  };

  // Calculate price
  const calculatePrice = useCallback(() => {
    const tier = TIER_DETAILS[formData.subscription_tier];
    const price = formData.billing_cycle === 'annual'
      ? tier.price_annual
      : formData.billing_cycle === 'league_duration'
      ? tier.price_monthly * 4
      : tier.price_monthly;
    return price;
  }, [formData.subscription_tier, formData.billing_cycle]);

  // Submit registration
  const submitRegistration = async () => {
    if (!user) {
      toast.error("Please sign in to register a league");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create league
      const { data: league, error: leagueError } = await supabase
        .from('leagues')
        .insert({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          format: formData.format,
          logo_url: formData.logo_url,
          created_by: user.id,
          is_suspended: true, // Suspended until approval
        })
        .select()
        .single();

      if (leagueError) throw leagueError;

      // Create subscription
      const { error: subError } = await supabase
        .from('league_subscriptions')
        .insert({
          league_id: league.id,
          tier: formData.subscription_tier,
          billing_cycle: formData.billing_cycle,
          amount: calculatePrice(),
          max_teams: TIER_DETAILS[formData.subscription_tier].max_teams,
          current_teams: 0,
          created_by: user.id,
        });

      if (subError) throw subError;

      // Create approval request
      const { error: approvalError } = await supabase
        .from('league_approvals')
        .insert({
          league_id: league.id,
          subscription_tier: formData.subscription_tier,
          billing_cycle: formData.billing_cycle,
          amount: calculatePrice(),
          created_by: user.id,
        });

      if (approvalError) throw approvalError;

      toast.success("League registration submitted for approval!");
      setStep(5); // Confirmation step
    } catch (error) {
      toast.error("Failed to register league");
      console.error(error);
    }

    setIsSubmitting(false);
  };

  // Validate step
  const canProceed = (): { step: number; valid: boolean } => {
    switch (step) {
      case 1:
        return { step: 1, valid: !!formData.name && !!formData.format };
      case 2:
        return { step: 2, valid: !!formData.subscription_tier && !!formData.billing_cycle };
      case 3:
        return { step: 3, valid: !!formData.estimated_teams && !!formData.start_date };
      case 4:
        return { step: 4, valid: !!formData.contact_email };
      default:
        return { step: step, valid: true };
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card className="border-cyan-900/50 bg-slate-950/90">
        <CardHeader className="py-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Building className="h-4 w-4 text-cyan-400" />
              League Registration
            </CardTitle>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-8 h-1 rounded ${
                    s <= step ? "bg-cyan-500" : "bg-slate-700"
                  }`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Building className="h-4 w-4" />
                Basic Information
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">League Name *</label>
                  <Input
                    placeholder="My Sports League"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">URL Slug</label>
                  <Input
                    value={formData.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    placeholder="my-sports-league"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    refai.com/leagues/{formData.slug || '...'}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Format *</label>
                  <div className="grid grid-cols-4 gap-2">
                    {Object.entries(FORMAT_LABELS).map(([format, label]) => (
                      <button
                        key={format}
                        className={`p-2 rounded border text-xs ${
                          formData.format === format
                            ? 'border-cyan-500 bg-cyan-950/30 text-cyan-400'
                            : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600'
                        }`}
                        onClick={() => updateField('format', format as LeagueFormat)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Description</label>
                  <Input
                    value={formData.description}
                    onChange={(e) => updateField('description', e.target.value)}
                    placeholder="About your league..."
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Logo URL</label>
                  <Input
                    value={formData.logo_url}
                    onChange={(e) => updateField('logo_url', e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Subscription */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Subscription Plan
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(TIER_DETAILS) as SubscriptionTier[]).map((tier) => (
                  <button
                    key={tier}
                    className={`p-3 rounded-lg border text-left ${
                      formData.subscription_tier === tier
                        ? 'border-cyan-500 bg-cyan-950/30'
                        : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                    }`}
                    onClick={() => updateField('subscription_tier', tier)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold capitalize text-white">{tier}</span>
                      {formData.subscription_tier === tier && (
                        <Check className="h-4 w-4 text-cyan-400" />
                      )}
                    </div>
                    <div className="text-lg font-bold text-white">
                      ${TIER_DETAILS[tier].price_monthly}
                      <span className="text-xs text-slate-400">/mo</span>
                    </div>
                    <div className="space-y-0.5 mt-2">
                      {TIER_DETAILS[tier].features.map((feature, i) => (
                        <div key={i} className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Check className="h-2.5 w-2.5 text-green-400" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-2">Billing Cycle</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['monthly', 'annual', 'league_duration'] as BillingCycle[]).map((cycle) => (
                    <button
                      key={cycle}
                      className={`p-2 rounded border text-xs ${
                        formData.billing_cycle === cycle
                          ? 'border-cyan-500 bg-cyan-950/30 text-cyan-400'
                          : 'border-slate-700 bg-slate-800/50 text-slate-300'
                      }`}
                      onClick={() => updateField('billing_cycle', cycle)}
                    >
                      <div className="font-medium capitalize">
                        {cycle.replace('_', ' ')}
                      </div>
                      {cycle === 'annual' && (
                        <div className="text-green-400 text-[10px]">Save 20%</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="h-4 w-4" />
                League Details
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Estimated Teams *</label>
                  <Input
                    type="number"
                    value={formData.estimated_teams}
                    onChange={(e) => updateField('estimated_teams', parseInt(e.target.value) || 0)}
                    min={2}
                    max={TIER_DETAILS[formData.subscription_tier].max_teams || 100}
                  />
                  {TIER_DETAILS[formData.subscription_tier].max_teams > 0 && (
                    <p className="text-[10px] text-slate-500 mt-1">
                      Max {TIER_DETAILS[formData.subscription_tier].max_teams} teams for {formData.subscription_tier} plan
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Start Date *</label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => updateField('start_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">End Date</label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => updateField('end_date', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Rules Document URL</label>
                  <Input
                    value={formData.rules_document_url}
                    onChange={(e) => updateField('rules_document_url', e.target.value)}
                    placeholder="https://..."
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Optional: Link to league rules and regulations
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Contact & Payment */}
          {step === 4 && (
            <div className="space-y-4">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Contact & Payment
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Contact Email *</label>
                  <Input
                    type="email"
                    value={formData.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-400 block mb-1">Contact Phone</label>
                  <Input
                    type="tel"
                    value={formData.contact_phone}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                  />
                </div>

                {/* Order Summary */}
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                  <div className="text-xs font-semibold text-slate-400 mb-2">Order Summary</div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan:</span>
                      <span className="text-white capitalize">{formData.subscription_tier}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Billing:</span>
                      <span className="text-white capitalize">{formData.billing_cycle.replace('_', ' ')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Format:</span>
                      <span className="text-white">{FORMAT_LABELS[formData.format]}</span>
                    </div>
                    <div className="border-t border-slate-600 pt-2 mt-2 flex justify-between font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-green-400">${calculatePrice()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Confirmation */}
          {step === 5 && (
            <div className="text-center py-8">
              <CheckCircle className="h-16 w-16 mx-auto text-green-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Registration Submitted!</h3>
              <p className="text-slate-400 mb-4">
                Your league registration is pending admin approval.
                You will receive an email once approved.
              </p>
              <Badge className="bg-yellow-500">Pending Approval</Badge>
            </div>
          )}

          {/* Navigation */}
          {step < 5 && (
            <div className="flex gap-2 pt-4 border-t border-slate-700">
              {step > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setStep(step - 1)}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              {step < 4 ? (
                <Button
                  size="sm"
                  className="flex-1"
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceed().valid}
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-500"
                  onClick={submitRegistration}
                  disabled={isSubmitting || !canProceed().valid}
                >
                  {isSubmitting ? "Submitting..." : "Submit Registration"}
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
