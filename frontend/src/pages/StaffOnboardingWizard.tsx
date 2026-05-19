/**
 * Staff Onboarding Wizard
 * Step-by-step wizard for new staff (documents, training, rostering)
 */

import { useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, FileText, GraduationCap, Calendar, CheckCircle, 
  ChevronRight, ChevronLeft, Upload, AlertCircle, Loader2,
  Shield, Clock, Camera, Phone, Mail, MapPin, Heart
} from "lucide-react";
import { PrimaryButton, OutlineButton, Avatar } from "@/components/ui-kit";
import { toast } from "sonner";
import maureenImg from "@/assets/maureen.png";

type OnboardingStep = "welcome" | "profile" | "documents" | "training" | "schedule" | "complete";

const STEPS: { id: OnboardingStep; title: string; description: string; icon: React.ElementType }[] = [
  { id: "welcome", title: "Welcome", description: "Get started with Carters Care", icon: Heart },
  { id: "profile", title: "Your Profile", description: "Verify your details", icon: User },
  { id: "documents", title: "Documents", description: "Upload required documents", icon: FileText },
  { id: "training", title: "Training", description: "Complete mandatory training", icon: GraduationCap },
  { id: "schedule", title: "Availability", description: "Set your schedule preferences", icon: Calendar },
  { id: "complete", title: "All Done", description: "You're ready to start", icon: CheckCircle },
];

const REQUIRED_DOCUMENTS = [
  { id: "id_proof", label: "Photo ID (Passport/Driver's License)", required: true },
  { id: "police_check", label: "National Police Check", required: true },
  { id: "wwcc", label: "Working With Children Check", required: true },
  { id: "first_aid", label: "First Aid Certificate", required: true },
  { id: "covid_vax", label: "COVID-19 Vaccination Certificate", required: true },
  { id: "qualifications", label: "Relevant Qualifications", required: false },
  { id: "resume", label: "Resume/CV", required: false },
];

const MANDATORY_TRAINING = [
  { id: "induction", label: "Company Induction", duration: "30 mins", completed: false },
  { id: "manual_handling", label: "Manual Handling", duration: "45 mins", completed: false },
  { id: "infection_control", label: "Infection Control", duration: "30 mins", completed: false },
  { id: "medication", label: "Medication Administration", duration: "60 mins", completed: false },
  { id: "privacy", label: "Privacy & Confidentiality", duration: "20 mins", completed: false },
];

export default function StaffOnboardingWizard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  const [completedTraining, setCompletedTraining] = useState<Record<string, boolean>>({});
  const [availability, setAvailability] = useState({
    monday: { available: true, start: "08:00", end: "18:00" },
    tuesday: { available: true, start: "08:00", end: "18:00" },
    wednesday: { available: true, start: "08:00", end: "18:00" },
    thursday: { available: true, start: "08:00", end: "18:00" },
    friday: { available: true, start: "08:00", end: "18:00" },
    saturday: { available: false, start: "08:00", end: "18:00" },
    sunday: { available: false, start: "08:00", end: "18:00" },
  });

  // Get staff profile
  const { data: staffProfile } = useQuery({
    queryKey: ["staff-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("staff")
        .select("*")
        .eq("user_id", user?.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const currentStepIndex = STEPS.findIndex(s => s.id === currentStep);
  const progress = ((currentStepIndex) / (STEPS.length - 1)) * 100;

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      setCurrentStep(STEPS[nextIndex].id);
    }
  };

  const goToPrevStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex].id);
    }
  };

  const uploadedCount = Object.values(uploadedDocs).filter(Boolean).length;
  const requiredDocsCount = REQUIRED_DOCUMENTS.filter(d => d.required).length;
  const trainingCount = Object.values(completedTraining).filter(Boolean).length;

  return (
    <AppLayout title="Staff Onboarding">
      <div className="max-w-3xl mx-auto">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Onboarding Progress</span>
            <span className="text-sm font-bold text-purple-600">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          {/* Step indicators */}
          <div className="flex justify-between mt-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index < currentStepIndex;
              const isCurrent = step.id === currentStep;
              return (
                <div key={step.id} className="flex flex-col items-center">
                  <div
                    className={`h-10 w-10 rounded-full flex items-center justify-center transition-all ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isCurrent
                        ? "bg-purple-500 text-white shadow-lg"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs mt-2 font-medium ${isCurrent ? "text-purple-600" : "text-slate-400"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl border shadow-sm overflow-hidden"
          >
            {currentStep === "welcome" && (
              <WelcomeStep staffProfile={staffProfile} onNext={goToNextStep} />
            )}
            {currentStep === "profile" && (
              <ProfileStep staffProfile={staffProfile} onNext={goToNextStep} onPrev={goToPrevStep} />
            )}
            {currentStep === "documents" && (
              <DocumentsStep
                uploadedDocs={uploadedDocs}
                setUploadedDocs={setUploadedDocs}
                onNext={goToNextStep}
                onPrev={goToPrevStep}
              />
            )}
            {currentStep === "training" && (
              <TrainingStep
                completedTraining={completedTraining}
                setCompletedTraining={setCompletedTraining}
                onNext={goToNextStep}
                onPrev={goToPrevStep}
              />
            )}
            {currentStep === "schedule" && (
              <ScheduleStep
                availability={availability}
                setAvailability={setAvailability}
                onNext={goToNextStep}
                onPrev={goToPrevStep}
              />
            )}
            {currentStep === "complete" && (
              <CompleteStep staffProfile={staffProfile} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Maureen Help */}
        <div className="mt-6 bg-purple-50 rounded-xl p-4 flex items-start gap-3 border border-purple-100">
          <img src={maureenImg} alt="Maureen" className="h-10 w-10 rounded-full" />
          <div>
            <p className="text-sm font-semibold text-purple-800">Need help?</p>
            <p className="text-xs text-purple-600 mt-0.5">
              I'm Maureen, your onboarding guide. Click the chat button if you have any questions about the process.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

// Welcome Step
function WelcomeStep({ staffProfile, onNext }: { staffProfile: any; onNext: () => void }) {
  return (
    <div className="p-8 text-center">
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center mx-auto mb-6">
        <Heart className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">
        Welcome to Carters Care{staffProfile?.first_name ? `, ${staffProfile.first_name}` : ""}!
      </h1>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        We're excited to have you join our care team. This wizard will guide you through the onboarding process step by step.
      </p>
      <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto mb-8">
        <div className="p-4 bg-slate-50 rounded-xl text-center">
          <FileText className="h-6 w-6 text-blue-500 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600">Upload Documents</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl text-center">
          <GraduationCap className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600">Complete Training</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl text-center">
          <Calendar className="h-6 w-6 text-orange-500 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600">Set Availability</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-xl text-center">
          <CheckCircle className="h-6 w-6 text-purple-500 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600">Start Working</p>
        </div>
      </div>
      <PrimaryButton onClick={onNext} className="mx-auto">
        Let's Get Started <ChevronRight className="h-4 w-4" />
      </PrimaryButton>
    </div>
  );
}

// Profile Step
function ProfileStep({ staffProfile, onNext, onPrev }: { staffProfile: any; onNext: () => void; onPrev: () => void }) {
  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-1">Verify Your Profile</h2>
      <p className="text-sm text-slate-500 mb-6">Please confirm your details are correct.</p>
      
      <div className="flex items-center gap-4 mb-6">
        <Avatar name={staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : "?"} size="lg" />
        <div>
          <p className="font-semibold text-slate-800">
            {staffProfile?.first_name} {staffProfile?.last_name}
          </p>
          <p className="text-sm text-slate-500">{staffProfile?.role || "Support Worker"}</p>
        </div>
      </div>

      <div className="space-y-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <Mail className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Email</p>
            <p className="text-sm font-medium text-slate-700">{staffProfile?.email || "Not set"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <Phone className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Phone</p>
            <p className="text-sm font-medium text-slate-700">{staffProfile?.phone || "Not set"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
          <MapPin className="h-5 w-5 text-slate-400" />
          <div>
            <p className="text-xs text-slate-500">Address</p>
            <p className="text-sm font-medium text-slate-700">{staffProfile?.address || "Not set"}</p>
          </div>
        </div>
      </div>

      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-6">
        <p className="text-xs text-amber-700">
          <AlertCircle className="h-4 w-4 inline mr-1" />
          If any details are incorrect, please contact your administrator to update them.
        </p>
      </div>

      <div className="flex justify-between">
        <OutlineButton onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" /> Back
        </OutlineButton>
        <PrimaryButton onClick={onNext}>
          Looks Good <ChevronRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

// Documents Step
function DocumentsStep({
  uploadedDocs,
  setUploadedDocs,
  onNext,
  onPrev,
}: {
  uploadedDocs: Record<string, boolean>;
  setUploadedDocs: (docs: Record<string, boolean>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const handleUpload = (docId: string) => {
    // Simulate upload
    setUploadedDocs({ ...uploadedDocs, [docId]: true });
    toast.success("Document uploaded successfully");
  };

  const requiredComplete = REQUIRED_DOCUMENTS.filter(d => d.required).every(d => uploadedDocs[d.id]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-1">Upload Documents</h2>
      <p className="text-sm text-slate-500 mb-6">Please upload the following documents to complete your onboarding.</p>

      <div className="space-y-3 mb-6">
        {REQUIRED_DOCUMENTS.map((doc) => (
          <div
            key={doc.id}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              uploadedDocs[doc.id] ? "bg-green-50 border-green-200" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {uploadedDocs[doc.id] ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <FileText className="h-5 w-5 text-slate-400" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-700">{doc.label}</p>
                <p className="text-xs text-slate-400">
                  {doc.required ? "Required" : "Optional"}
                </p>
              </div>
            </div>
            {!uploadedDocs[doc.id] && (
              <button
                onClick={() => handleUpload(doc.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
              >
                <Upload className="h-3 w-3 inline mr-1" /> Upload
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <OutlineButton onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" /> Back
        </OutlineButton>
        <PrimaryButton onClick={onNext} disabled={!requiredComplete}>
          Continue <ChevronRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

// Training Step
function TrainingStep({
  completedTraining,
  setCompletedTraining,
  onNext,
  onPrev,
}: {
  completedTraining: Record<string, boolean>;
  setCompletedTraining: (training: Record<string, boolean>) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const handleStartTraining = (trainingId: string) => {
    // Simulate training completion
    toast.info("Training module opened in new tab");
    setTimeout(() => {
      setCompletedTraining({ ...completedTraining, [trainingId]: true });
      toast.success("Training module completed!");
    }, 2000);
  };

  const allComplete = MANDATORY_TRAINING.every(t => completedTraining[t.id]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-1">Mandatory Training</h2>
      <p className="text-sm text-slate-500 mb-6">Complete the following training modules before you can start working.</p>

      <div className="space-y-3 mb-6">
        {MANDATORY_TRAINING.map((training) => (
          <div
            key={training.id}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              completedTraining[training.id] ? "bg-green-50 border-green-200" : "bg-white border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              {completedTraining[training.id] ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <GraduationCap className="h-5 w-5 text-slate-400" />
              )}
              <div>
                <p className="text-sm font-medium text-slate-700">{training.label}</p>
                <p className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {training.duration}
                </p>
              </div>
            </div>
            {!completedTraining[training.id] && (
              <button
                onClick={() => handleStartTraining(training.id)}
                className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
              >
                Start
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <OutlineButton onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" /> Back
        </OutlineButton>
        <PrimaryButton onClick={onNext} disabled={!allComplete}>
          Continue <ChevronRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

// Schedule Step
function ScheduleStep({
  availability,
  setAvailability,
  onNext,
  onPrev,
}: {
  availability: Record<string, { available: boolean; start: string; end: string }>;
  setAvailability: (a: any) => void;
  onNext: () => void;
  onPrev: () => void;
}) {
  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
  const dayLabels: Record<string, string> = {
    monday: "Monday",
    tuesday: "Tuesday",
    wednesday: "Wednesday",
    thursday: "Thursday",
    friday: "Friday",
    saturday: "Saturday",
    sunday: "Sunday",
  };

  const toggleDay = (day: string) => {
    setAvailability({
      ...availability,
      [day]: { ...availability[day], available: !availability[day].available },
    });
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-bold text-slate-800 mb-1">Set Your Availability</h2>
      <p className="text-sm text-slate-500 mb-6">Let us know when you're available to work.</p>

      <div className="space-y-2 mb-6">
        {days.map((day) => (
          <div
            key={day}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              availability[day].available ? "bg-green-50 border-green-200" : "bg-slate-50 border-slate-200"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                onClick={() => toggleDay(day)}
                className={`h-5 w-5 rounded flex items-center justify-center ${
                  availability[day].available ? "bg-green-500 text-white" : "border-2 border-slate-300"
                }`}
              >
                {availability[day].available && <CheckCircle className="h-3 w-3" />}
              </button>
              <span className="text-sm font-medium text-slate-700">{dayLabels[day]}</span>
            </div>
            {availability[day].available && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <input
                  type="time"
                  value={availability[day].start}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      [day]: { ...availability[day], start: e.target.value },
                    })
                  }
                  className="px-2 py-1 rounded border border-slate-200 text-xs"
                />
                <span>to</span>
                <input
                  type="time"
                  value={availability[day].end}
                  onChange={(e) =>
                    setAvailability({
                      ...availability,
                      [day]: { ...availability[day], end: e.target.value },
                    })
                  }
                  className="px-2 py-1 rounded border border-slate-200 text-xs"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-between">
        <OutlineButton onClick={onPrev}>
          <ChevronLeft className="h-4 w-4" /> Back
        </OutlineButton>
        <PrimaryButton onClick={onNext}>
          Complete Setup <ChevronRight className="h-4 w-4" />
        </PrimaryButton>
      </div>
    </div>
  );
}

// Complete Step
function CompleteStep({ staffProfile }: { staffProfile: any }) {
  return (
    <div className="p-8 text-center">
      <div className="h-20 w-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-800 mb-2">You're All Set!</h1>
      <p className="text-slate-500 mb-8 max-w-md mx-auto">
        Congratulations, {staffProfile?.first_name}! Your onboarding is complete. You're now ready to start accepting shifts.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <PrimaryButton onClick={() => window.location.href = "/my-roster"}>
          <Calendar className="h-4 w-4" /> View My Roster
        </PrimaryButton>
        <OutlineButton onClick={() => window.location.href = "/"}>
          Go to Dashboard
        </OutlineButton>
      </div>
    </div>
  );
}
