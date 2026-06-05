import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import {
  User,
  Briefcase,
  Award,
  MapPin,
  DollarSign,
  Loader2,
} from "lucide-react";
import { useRegisterCaregiverMutation } from "../../../features/caregivers/caregiverApiSlice";
import { useGetAgenciesQuery } from "../../../features/agencies/agencyApiSlice";

const CaregiverSetup = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [registerCaregiver, { isLoading }] = useRegisterCaregiverMutation();
  const { data: agenciesResponse, isLoading: loadingAgencies } =
    useGetAgenciesQuery({ status: "approved" });
  const navigate = useNavigate();
console.log("data",agenciesResponse);

  const onSubmit = async (data) => {
    console.log("Begin onSubmit", data);
    try {
     
      const result = await registerCaregiver(data).unwrap();

      toast.success("Profile created successfully!");
      navigate("/dashboard/caregiver");
    } catch (err) {
      console.error("Mutation error", err);
      toast.error(err?.data?.message || "Failed to create profile");
    }
  };

  if (loadingAgencies)
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin text-primary-600" size={48} />
      </div>
    );

  const agencies = agenciesResponse?.data || [];


  return (
    <div className="max-w-3xl mx-auto space-y-8 py-8 px-4">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          Caregiver Profile Setup
        </h1>
        <p className="text-gray-500">
          Complete your profile to start receiving job assignments.
        </p>
      </div>

      <form
        onSubmit={(event) => {
          console.log("Form onSubmit event", event);
          handleSubmit((data) => {
            console.log("React Hook Form handleSubmit callback", data);
            onSubmit(data);
          })(event);
        }}
        className="card p-8 space-y-8 shadow-xl border-none bg-white"
      >
        {/* Section 1: Basic Info */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
            <User size={20} className="text-primary-600" /> Basic Information
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Display Name
              </label>
              <input
                {...register("name", { required: "Name is required" })}
                className="input"
                placeholder="Jane Doe"
              />
              {errors.name && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Select Agency
              </label>
              <select
                {...register("agencyId", {
                  required: "Please select an agency",
                })}
                className="input"
              >
                <option value="">Choose an agency...</option>
                {agencies.map((agency) => (
                  <option key={agency._id} value={agency._id}>
                    {agency.agencyName}
                  </option>
                ))}
              </select>
              {errors.agencyId && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.agencyId.message}
                </p>
              )}
              {agencies.length === 0 && (
                <p className="text-amber-600 text-xs mt-1">
                  No agencies available yet.
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Service Specialty
              </label>
              <select
                {...register("serviceType", {
                  required: "Specialty is required",
                })}
                className="input"
              >
                <option value="babysitter">Babysitter</option>
                <option value="nurse">Nurse</option>
                <option value="elder_care">Elder Care</option>
                <option value="special_needs">Special Needs</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Years of Experience
              </label>
              <input
                type="number"
                {...register("experience", {
                  required: "Experience is required",
                  min: { value: 0, message: "Experience cannot be negative" },
                })}
                className="input"
                placeholder="5"
              />
              {errors.experience && (
                <p className="text-sm text-red-600 mt-1">
                  {errors.experience.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section 2: Rates */}
        <div className="space-y-6">
          <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
            <DollarSign size={20} className="text-primary-600" /> Hourly Rates
            (USD)
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Hourly
              </label>
              <input
                type="number"
                {...register("hourlyRate")}
                className="input"
                placeholder="25"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Daily
              </label>
              <input
                type="number"
                {...register("dailyRate")}
                className="input"
                placeholder="200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Weekly
              </label>
              <input
                type="number"
                {...register("weeklyRate")}
                className="input"
                placeholder="1200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">
                Monthly
              </label>
              <input
                type="number"
                {...register("monthlyRate")}
                className="input"
                placeholder="4500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Bio */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold border-b pb-2 flex items-center gap-2">
            <Award size={20} className="text-primary-600" /> Bio & About
          </h3>
          <textarea
            {...register("bio", {
              required: "Bio is required",
              maxLength: {
                value: 800,
                message: "Bio cannot exceed 800 characters",
              },
            })}
            className="input min-h-[150px] py-3"
            placeholder="Share your background, skills, and why you enjoy providing care..."
          ></textarea>
          {errors.bio && (
            <p className="text-sm text-red-600">{errors.bio.message}</p>
          )}
          <p className="text-xs text-gray-400 text-right">
            Maximum 800 characters
          </p>
        </div>

        <button
          type="submit"
          onClick={() => console.log("Submit button onClick")}
          disabled={isLoading}
          className="btn btn-primary w-full py-4 text-lg font-bold shadow-lg"
        >
          {isLoading ? (
            <Loader2 className="animate-spin mx-auto" />
          ) : (
            "Complete Profile Setup"
          )}
        </button>
      </form>
    </div>
  );
};

export default CaregiverSetup;
