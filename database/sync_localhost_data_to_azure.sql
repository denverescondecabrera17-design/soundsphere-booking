-- ========================================================
-- SoundSphere - Sync Localhost Data to Azure SQL Database
-- Generated: 2026-10-11T13:39:27.190Z
-- ========================================================

SET NOCOUNT ON;

-- --------------------------------------------------------
-- Table: dbo.[Roles] (5 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Roles] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Roles] WHERE [RoleID] = 1)
BEGIN
    INSERT INTO dbo.[Roles] ([RoleID], [RoleName], [Description], [CreatedAt])
    VALUES (1, 'Admin', 'System Administrator with full management access', '2026-07-26T19:31:04.613Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Roles] WHERE [RoleID] = 2)
BEGIN
    INSERT INTO dbo.[Roles] ([RoleID], [RoleName], [Description], [CreatedAt])
    VALUES (2, 'Client', 'Event organizer looking to book lights & sounds services', '2026-07-26T19:31:04.613Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Roles] WHERE [RoleID] = 3)
BEGIN
    INSERT INTO dbo.[Roles] ([RoleID], [RoleName], [Description], [CreatedAt])
    VALUES (3, 'ServiceProvider', 'Business owner providing lights & sounds equipment/services', '2026-07-26T19:31:04.613Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Roles] WHERE [RoleID] = 4)
BEGIN
    INSERT INTO dbo.[Roles] ([RoleID], [RoleName], [Description], [CreatedAt])
    VALUES (4, 'Administrator', 'Platform Superadmin', '2026-08-09T11:26:20.320Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Roles] WHERE [RoleID] = 6)
BEGIN
    INSERT INTO dbo.[Roles] ([RoleID], [RoleName], [Description], [CreatedAt])
    VALUES (6, 'Cashier', 'Finance and Cashier Staff', '2026-10-09T10:18:38.056Z');
END;
SET IDENTITY_INSERT dbo.[Roles] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Users] (9 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Users] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 1)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (1, 2, 'denverescondecabrera17@gmail.com', '$2b$10$3SJAKQ83p38sCOYegyIPD.laY6tNMqmjLxnPRT1B4iUZ3Q3z.hjPq', '09516028992', 1, 'Active', '2026-07-26T21:02:05.376Z', '2026-08-25T12:01:10.680Z', 1, 'uploads/avatars/avatar-1787567756353-891632673.jpg', NULL, NULL, '117496811241246532342', NULL, 'Google');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 2)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (2, 2, 'cabrera@gmail.com', '$2b$10$7evRu53e148WGZQErpW35OALL9s357alWPGCr2N8SEtIjYhOqO5Di', '09516028992', 1, 'Active', '2026-07-26T21:07:18.220Z', '2026-07-26T21:07:18.220Z', 1, NULL, NULL, NULL, NULL, NULL, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 4)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (4, 4, 'soundsphere@gmail.com', '$2b$10$ffN0.pXxsFkIiI5LvtZlmOq3gSCesZGbmSQdIjxT23TVkiV8X2vE2', '09516028992', 1, 'Active', '2026-08-09T11:26:20.853Z', '2026-08-25T12:10:22.010Z', 1, NULL, NULL, NULL, NULL, NULL, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 8)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (8, 2, 'dendenescondecabrera17@gmail.com', '$2b$10$1y9faNOsgRJ8.ml7jNHqTemA9ULsdOi.tWLnnXnKg//THersMKTri', '09516028992', 1, 'Active', '2026-08-09T11:52:15.026Z', '2026-08-09T12:55:39.956Z', 1, 'uploads/avatars/avatar-1787307241461-136269129.jpg', '205524', '2026-08-23T09:38:17.379Z', '109748800497059605377', NULL, 'Google');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 9)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (9, 2, 'printcessbalayan@gmail.com', '$2b$10$SvQQYOSb2JMEJ7K9lkO3...Cw8Khsd3ptColM0qysxb2f2hXobyTW', '09516028992', 1, 'Active', '2026-08-09T14:48:31.810Z', '2026-08-09T14:48:31.810Z', 1, NULL, NULL, NULL, NULL, NULL, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 13)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (13, 3, 'denvercabrera.apo@gmail.com', '$2b$10$.OKyiWi1bydPmoEqycK.lePbezuJanGfiEf3RmzLo8nwMyeVDa1eq', '09516028992', 1, 'Active', '2026-08-21T12:39:55.600Z', '2026-08-29T13:49:14.680Z', 1, 'uploads/avatars/avatar-1788072295578-304606820.png', NULL, NULL, '111240178107912690438', NULL, 'Google');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 14)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (14, 2, 'denvercarera.apo@gmail.com', '$2b$10$D883v6ch6N2R5lIyIpiCGOQdLXBxp9xEgwnJxyqpNlI32CpvHTooq', '09516028992', 1, 'Active', '2026-08-21T17:19:37.533Z', '2026-08-21T17:19:37.533Z', 1, NULL, NULL, NULL, NULL, NULL, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 34)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (34, 2, 'client@soundsphere.com', '$2b$10$R.7cR8lFCwUERwJdhXFN8uAacpqlBfeNLKPS2706BfuGqCYkAdoUC', '09181234567', 1, 'Active', '2026-10-05T20:39:18.920Z', '2026-10-05T20:39:18.920Z', 1, NULL, NULL, NULL, NULL, NULL, 'local');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Users] WHERE [UserID] = 35)
BEGIN
    INSERT INTO dbo.[Users] ([UserID], [RoleID], [Email], [PasswordHash], [Phone], [IsActive], [AccountStatus], [CreatedAt], [UpdatedAt], [EmailVerified], [ProfilePicture], [ResetToken], [ResetTokenExpiry], [GoogleID], [FacebookID], [AuthProvider])
    VALUES (35, 6, 'cashier@soundsphere.com', '$2b$10$.HnWpC1flbD7x485E5fbDODnS.Cr1XRguI4ljQcIbc/iGwg5pVSMu', '09191234567', 1, 'Active', '2026-10-09T10:26:56.743Z', '2026-10-09T10:26:56.743Z', 1, NULL, NULL, NULL, NULL, NULL, 'local');
END;
SET IDENTITY_INSERT dbo.[Users] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Clients] (9 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Clients] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 1)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (1, 13, 'Denver', NULL, 'Cabrera', 'Denver Cabrera', 'Lian, Balayan, Nasugbu', '2026-08-30T13:58:41.406Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 2)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (2, 2, 'Denver', NULL, 'Cabrera', 'Denver Cabrera', NULL, '2026-08-30T13:59:11.120Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 3)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (3, 8, 'Denver', NULL, 'Cabrera', 'Denver Cabrera', 'Brgy 8, Balayan Batangas', '2026-08-30T13:59:11.170Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 4)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (4, 14, 'Denver', NULL, 'Cabrera', 'Denver Cabrera', NULL, '2026-08-30T13:59:11.270Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 5)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (5, 1, 'Denver', NULL, 'Cabrera', 'Denver Cabrera', 'Balayan', '2026-08-30T13:59:11.310Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 6)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (6, 9, 'Princess', NULL, 'Balayan', 'Princess Balayan', NULL, '2026-08-30T13:59:11.353Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 7)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (7, 4, 'Client', NULL, 'User', 'Client User', NULL, '2026-08-30T13:59:11.390Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 8)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (8, 34, 'Denver', NULL, 'Cabrera', NULL, NULL, '2026-10-05T20:39:18.933Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Clients] WHERE [ClientID] = 9)
BEGIN
    INSERT INTO dbo.[Clients] ([ClientID], [UserID], [FirstName], [MiddleName], [LastName], [FullName], [Address], [CreatedAt])
    VALUES (9, 35, 'Official', NULL, 'Cashier', NULL, NULL, '2026-10-09T10:26:56.750Z');
END;
SET IDENTITY_INSERT dbo.[Clients] OFF;

-- --------------------------------------------------------
-- Table: dbo.[ServiceProviders] (1 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[ServiceProviders] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[ServiceProviders] WHERE [ProviderID] = 1)
BEGIN
    INSERT INTO dbo.[ServiceProviders] ([ProviderID], [UserID], [BusinessName], [OwnerName], [BusinessAddress], [CoverageArea], [Description], [VerificationStatus], [CreatedAt], [OwnerFirstName], [OwnerLastName], [ProfilePicture], [ContactNumber], [ApplicationID], [Latitude], [Longitude], [PermitExpiryDate], [MaxDailyBookings])
    VALUES (1, 13, 'CHiCHa Lights and Sounds', 'Denver Cabrera', 'Lian, Balayan, Nasugbu', 'Lian, Balayan, Nasugbu', 'Professional Lights & Sounds Service Provider.', 'Approved', '2026-08-30T13:59:10.966Z', 'Denver', 'Cabrera', 'uploads/avatars/provider-avatar-1788072268945-324628540.jpg', '09516028992', NULL, NULL, NULL, NULL, 1);
END;
SET IDENTITY_INSERT dbo.[ServiceProviders] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Packages] (2 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Packages] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Packages] WHERE [PackageID] = 17)
BEGIN
    INSERT INTO dbo.[Packages] ([PackageID], [UserID], [PackageName], [Category], [Price], [Description], [Inclusions], [BannerUrl], [IsActive], [CreatedAt], [AdditionalDayPercentage])
    VALUES (17, 13, 'Birthday Package', 'Basic Package', 1000, 'its for birthday party', '2 microphone, 2 speakers, 2 lights', NULL, 1, '2026-08-29T22:26:06.516Z', 21);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Packages] WHERE [PackageID] = 31)
BEGIN
    INSERT INTO dbo.[Packages] ([PackageID], [UserID], [PackageName], [Category], [Price], [Description], [Inclusions], [BannerUrl], [IsActive], [CreatedAt], [AdditionalDayPercentage])
    VALUES (31, 13, 'wedding package', 'Full Band Package', 5000, 'For Wedding', '2 Speakers, 1 mic', NULL, 1, '2026-08-30T22:15:23.903Z', 20);
END;
SET IDENTITY_INSERT dbo.[Packages] OFF;

-- --------------------------------------------------------
-- Table: dbo.[PackageImages] (4 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[PackageImages] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[PackageImages] WHERE [ImageID] = 3)
BEGIN
    INSERT INTO dbo.[PackageImages] ([ImageID], [PackageID], [ImageUrl], [CreatedAt])
    VALUES (3, 17, 'uploads/packages/package-photo-1788090704952-714980911.jpg', '2026-08-30T19:51:45.100Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[PackageImages] WHERE [ImageID] = 4)
BEGIN
    INSERT INTO dbo.[PackageImages] ([ImageID], [PackageID], [ImageUrl], [CreatedAt])
    VALUES (4, 31, 'uploads/packages/package-photo-1788099322933-164123636.jpg', '2026-08-30T22:15:24.030Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[PackageImages] WHERE [ImageID] = 6)
BEGIN
    INSERT INTO dbo.[PackageImages] ([ImageID], [PackageID], [ImageUrl], [CreatedAt])
    VALUES (6, 17, 'uploads/packages/package-photo-1791536859353-764103536.png', '2026-10-09T17:07:40.990Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[PackageImages] WHERE [ImageID] = 7)
BEGIN
    INSERT INTO dbo.[PackageImages] ([ImageID], [PackageID], [ImageUrl], [CreatedAt])
    VALUES (7, 17, 'uploads/packages/package-photo-1791536860179-494668880.png', '2026-10-09T17:07:40.996Z');
END;
SET IDENTITY_INSERT dbo.[PackageImages] OFF;

-- --------------------------------------------------------
-- Table: dbo.[ProviderDateCapacity] (35 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[ProviderDateCapacity] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 1)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (1, 5, '2026-10-25', 3, 'High capacity month', '2026-10-09T16:28:12.400Z', '2026-10-09T16:35:52.286Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 2)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (2, 5, '2026-10-28', 3, 'High capacity month', '2026-10-09T16:28:12.433Z', '2026-10-09T16:35:52.290Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 4)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (4, 1, '2026-10-17', 1, '', '2026-10-09T16:33:33.593Z', '2026-10-10T21:08:45.930Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 5)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (5, 5, '2026-10-01', 3, 'High capacity month', '2026-10-09T16:35:52.250Z', '2026-10-09T16:35:52.250Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 6)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (6, 5, '2026-10-02', 3, 'High capacity month', '2026-10-09T16:35:52.250Z', '2026-10-09T16:35:52.250Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 7)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (7, 5, '2026-10-03', 3, 'High capacity month', '2026-10-09T16:35:52.253Z', '2026-10-09T16:35:52.253Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 8)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (8, 5, '2026-10-04', 3, 'High capacity month', '2026-10-09T16:35:52.253Z', '2026-10-09T16:35:52.253Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 9)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (9, 5, '2026-10-05', 3, 'High capacity month', '2026-10-09T16:35:52.253Z', '2026-10-09T16:35:52.253Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 10)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (10, 5, '2026-10-06', 3, 'High capacity month', '2026-10-09T16:35:52.256Z', '2026-10-09T16:35:52.256Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 11)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (11, 5, '2026-10-07', 3, 'High capacity month', '2026-10-09T16:35:52.256Z', '2026-10-09T16:35:52.256Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 12)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (12, 5, '2026-10-08', 3, 'High capacity month', '2026-10-09T16:35:52.256Z', '2026-10-09T16:35:52.256Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 13)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (13, 5, '2026-10-09', 3, 'High capacity month', '2026-10-09T16:35:52.260Z', '2026-10-09T16:35:52.260Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 14)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (14, 5, '2026-10-10', 3, 'High capacity month', '2026-10-09T16:35:52.260Z', '2026-10-09T16:35:52.260Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 15)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (15, 5, '2026-10-11', 3, 'High capacity month', '2026-10-09T16:35:52.260Z', '2026-10-09T16:35:52.260Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 16)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (16, 5, '2026-10-12', 3, 'High capacity month', '2026-10-09T16:35:52.263Z', '2026-10-09T16:35:52.263Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 17)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (17, 5, '2026-10-13', 3, 'High capacity month', '2026-10-09T16:35:52.263Z', '2026-10-09T16:35:52.263Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 18)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (18, 5, '2026-10-14', 3, 'High capacity month', '2026-10-09T16:35:52.266Z', '2026-10-09T16:35:52.266Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 19)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (19, 5, '2026-10-15', 3, 'High capacity month', '2026-10-09T16:35:52.266Z', '2026-10-09T16:35:52.266Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 20)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (20, 5, '2026-10-16', 3, 'High capacity month', '2026-10-09T16:35:52.270Z', '2026-10-09T16:35:52.270Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 21)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (21, 5, '2026-10-17', 3, 'High capacity month', '2026-10-09T16:35:52.270Z', '2026-10-09T16:35:52.270Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 22)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (22, 5, '2026-10-18', 3, 'High capacity month', '2026-10-09T16:35:52.270Z', '2026-10-09T16:35:52.270Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 23)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (23, 5, '2026-10-19', 3, 'High capacity month', '2026-10-09T16:35:52.270Z', '2026-10-09T16:35:52.270Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 24)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (24, 5, '2026-10-20', 3, 'High capacity month', '2026-10-09T16:35:52.273Z', '2026-10-09T16:35:52.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 25)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (25, 5, '2026-10-21', 3, 'High capacity month', '2026-10-09T16:35:52.273Z', '2026-10-09T16:35:52.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 26)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (26, 5, '2026-10-22', 3, 'High capacity month', '2026-10-09T16:35:52.273Z', '2026-10-09T16:35:52.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 27)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (27, 5, '2026-10-23', 3, 'High capacity month', '2026-10-09T16:35:52.273Z', '2026-10-09T16:35:52.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 28)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (28, 5, '2026-10-24', 3, 'High capacity month', '2026-10-09T16:35:52.283Z', '2026-10-09T16:35:52.283Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 29)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (29, 5, '2026-10-26', 3, 'High capacity month', '2026-10-09T16:35:52.286Z', '2026-10-09T16:35:52.286Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 30)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (30, 5, '2026-10-27', 3, 'High capacity month', '2026-10-09T16:35:52.290Z', '2026-10-09T16:35:52.290Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 31)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (31, 5, '2026-10-29', 3, 'High capacity month', '2026-10-09T16:35:52.290Z', '2026-10-09T16:35:52.290Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 32)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (32, 5, '2026-10-30', 3, 'High capacity month', '2026-10-09T16:35:52.293Z', '2026-10-09T16:35:52.293Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 33)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (33, 5, '2026-10-31', 3, 'High capacity month', '2026-10-09T16:35:52.293Z', '2026-10-09T16:35:52.293Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 34)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (34, 1, '2026-10-16', 4, '', '2026-10-09T16:38:10.573Z', '2026-10-10T11:25:44.950Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 35)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (35, 1, '2026-10-15', 1, '', '2026-10-10T10:30:46.466Z', '2026-10-10T10:31:01.893Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderDateCapacity] WHERE [CapacityID] = 36)
BEGIN
    INSERT INTO dbo.[ProviderDateCapacity] ([CapacityID], [ProviderID], [SpecificDate], [MaxBookings], [Notes], [CreatedAt], [UpdatedAt])
    VALUES (36, 1, '2026-10-11', 3, '', '2026-10-11T11:09:43.733Z', '2026-10-11T11:09:43.733Z');
END;
SET IDENTITY_INSERT dbo.[ProviderDateCapacity] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Bookings] (25 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Bookings] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 9)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (9, 8, 13, 'Basic Sound Package', '2026-10-15', NULL, 'Balayan, Batangas', 15750, 'Completed', 'Paid', '2026-09-06T12:17:12.580Z', 'SS-2026-00001', 1, 'Birthday Party', 'Birthday', '06:00 PM', '10:00 PM', 4, 1, 'Balayan', 'Covered Court', 'Brgy 8, Balayan, Batangas', NULL, NULL, 'Near main entrance', 15000, 'full', 15750, 0, 5, 787.5, 14962.5, '2026-10-11T10:10:30.783Z', '2026-10-15', '2026-10-15', 1, 0, 750, 15, 'Released', 'Denver Cabrera', '09516028992', 'dendenescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 16)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (16, 1, 1, 'bundle a for wedding', '2026-09-07', NULL, 'dsfAWFWQ, Nasugbu', 760, 'Completed', 'Partial', '2026-09-06T15:59:11.043Z', 'SS-2026-00002', 17, 'AsefdQW', 'Birthday', '18:00', '22:00', 0, 1, 'Nasugbu', 'dsfAWFWQ', 'wqRDFQW', 14.0722, 120.6318, NULL, 10, 'downpayment', 380, 380, 5, 38, 722, '2026-10-09T16:15:36.096Z', '2026-09-07', '2026-09-07', 1, 0, 750, 18.3, 'Released', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 17)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (17, 8, 1, 'hkcdtusea', '2026-09-20', NULL, 'house, Balayan', 505, 'Completed', 'Paid', '2026-09-06T20:50:30.653Z', 'SS-2026-00003', 31, 'fiesta', 'Festival', '21:00', '03:00', 0, 1, 'Balayan', 'house', 'Barangay 8, San Juan, Langgangan, Balayan, Batangas, Calabarzon, 4213, Philippines', 13.93691, 120.738169, NULL, 5, 'full', 505, 0, 5, 25.25, 479.75, '2026-10-09T16:15:35.340Z', '2026-09-20', '2026-09-20', 1, 0, 500, 0.8, 'Held', 'Denver Cabrera', '09516028992', 'dendenescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 18)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (18, 8, 1, 'bundle a for wedding', '2026-09-21', NULL, 'qefwe, Lian', 760, 'Completed', 'Paid', '2026-09-07T10:21:11.510Z', 'SS-2026-00004', 17, 'DWQ', 'Party', '18:00', '22:00', 0, 1, 'Lian', 'qefwe', 'Brgy. Central, Lian, Batangas', 14.037018, 120.652747, NULL, 10, 'full', 760, 0, 5, 38, 722, '2026-10-09T16:15:34.680Z', '2026-09-21', '2026-09-21', 1, 0, 750, 13.8, 'Held', 'Denver Cabrera', '09516028992', 'dendenescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 19)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (19, 8, 1, 'bundle a for wedding', '2026-09-25', NULL, 'HIUT, Nasugbu', 760, 'Completed', 'Paid', '2026-09-07T11:22:14.483Z', 'SS-2026-00005', 17, 'KBIU', 'Party', '18:00', '22:00', 0, 1, 'Nasugbu', 'HIUT', 'JHGUG', 14.0722, 120.6318, NULL, 10, 'full', 760, 0, 5, 38, 722, '2026-10-09T16:15:33.950Z', '2026-09-25', '2026-09-25', 1, 0, 750, 18.3, 'Held', 'Denver Cabrera', '09516028992', 'dendenescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 20)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (20, 1, 1, 'bundle a for wedding', '2026-10-01', NULL, 'Lian Hall, Lian', 510, 'Completed', 'Partial', '2026-09-10T14:58:20.220Z', 'SS-2026-00006', 17, 'Birthday Test', 'Party', '18:00', '22:00', 0, 1, 'Lian', 'Lian Hall', 'Brgy. Central, Lian, Batangas', 13.8402, 120.6558, NULL, 10, 'downpayment', 255, 255, 5, 25.5, 484.5, '2026-10-09T09:25:30.656Z', '2026-10-01', '2026-10-01', 1, 0, 500, 15, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 21)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (21, 8, 1, 'bundle a for wedding', '2026-09-27', NULL, 'sfve, Balayan', 510, 'Completed', 'Paid', '2026-09-10T15:03:34.720Z', 'SS-2026-00007', 17, 'barako', 'Festival', '18:00', '22:00', 0, 1, 'Balayan', 'sfve', 'Barangay 8, San Juan, Langgangan, Balayan, Batangas, Calabarzon, 4213, Philippines', 13.93691, 120.738169, NULL, 10, 'full', 510, 0, 5, 25.5, 484.5, '2026-10-11T10:02:52.680Z', '2026-09-27', '2026-09-27', 1, 0, 500, 0.8, 'Held', 'Denver Cabrera', '09516028992', 'dendenescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 22)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (22, 8, 1, 'hkcdtusea', '2026-09-30', NULL, 'covered court, Balayan', 505, 'Completed', 'Paid', '2026-09-10T15:28:26.676Z', 'SS-2026-00008', 31, 'barako', 'Festival', '18:00', '22:00', 0, 1, 'Balayan', 'covered court', 'Barangay 8, San Juan, Langgangan, Balayan, Batangas, Calabarzon, 4213, Philippines', 13.93691, 120.738169, NULL, 5, 'full', 505, 0, 5, 25.25, 479.75, '2026-09-10T15:54:56.673Z', '2026-09-30', '2026-09-30', 1, 0, 500, 0.8, 'Held', 'Denver Cabrera', '09516028992', 'dendenescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 23)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (23, 8, 1, 'hkcdtusea', '2026-10-07', NULL, 'Qndjwa, Nasugbu', 755, 'Completed', 'Paid', '2026-10-06T18:18:50.320Z', 'SS-2026-00009', 31, 'WKNDJEQGF', 'Party', '18:00', '22:00', 0, 1, 'Nasugbu', 'Qndjwa', 'Barangay 1 (Poblacion), Nasugbu, Batangas', 14.0725, 120.632, NULL, 5, 'full', 755, 0, 5, 37.75, 717.25, '2026-10-09T09:25:27.253Z', '2026-10-07', '2026-10-07', 1, 0, 750, 18.3, 'Held', 'Denver Cabrera', '09516028992', 'dendenescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 24)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (24, 1, 1, 'bundle a for wedding', '2026-10-18', NULL, 'covered court, Balayan', 523, 'Completed', 'Paid', '2026-10-09T11:12:14.930Z', 'SS-2026-00010', 17, 'wedding', 'Wedding', '18:00', '22:00', 0, 7, 'Balayan', 'covered court', 'Barangay 8 (Poblacion), Balayan, Batangas', 13.9405, 120.7368, NULL, 10, 'full', 523, 0, 5, 26.15, 496.85, '2026-10-09T16:15:33.213Z', '2026-10-18', '2026-10-24', 7, 13, 500, 0.7, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 25)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (25, 1, 1, 'bundle a for wedding', '2026-10-30', NULL, 'court, Balayan', 512, 'Completed', 'Paid', '2026-10-09T11:14:00.550Z', 'SS-2026-00011', 17, 'wedding', 'Wedding', '18:00', '22:00', 0, 2, 'Balayan', 'court', 'Barangay 8 (Poblacion), Balayan, Batangas', 13.9405, 120.7368, NULL, 10, 'full', 512, 0, 5, 25.6, 486.4, '2026-10-09T11:21:04.640Z', '2026-10-30', '2026-10-31', 2, 2, 500, 0.7, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 26)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (26, 1, 1, 'bundle a for wedding', '2026-10-10', NULL, 'errefdewd, Balayan', 510, 'Completed', 'Paid', '2026-10-09T11:24:57.753Z', 'SS-2026-00012', 17, 'ugefe', 'Party', '18:00', '22:00', 0, 1, 'Balayan', 'errefdewd', 'Barangay 8, San Juan, Langgangan, Balayan, Batangas, Calabarzon, 4213, Philippines', 13.936734, 120.738169, NULL, 10, 'full', 510, 0, 5, 25.5, 484.5, '2026-10-09T16:15:31.563Z', '2026-10-10', '2026-10-10', 1, 0, 500, 0.8, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 27)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (27, 1, 1, 'bundle a for wedding', '2026-10-16', NULL, 'Covered court, Balayan', 510, 'Confirmed', 'Paid', '2026-10-09T18:09:08.096Z', 'SS-2026-00013', 17, 'Event Service Booking', 'Event', '10:00', '22:00', 0, 1, 'Balayan', 'Covered court', 'Barangay 8, San Juan, Langgangan, Balayan, Batangas, Calabarzon, 4213, Philippines', 13.937023, 120.738194, NULL, 10, 'full', 510, 0, 5, 25.5, 484.5, NULL, '2026-10-16', '2026-10-16', 1, 0, 500, 0.8, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 28)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (28, 1, 1, 'bundle a for wedding', '2026-10-16', NULL, 'covered court, Balayan', 510, 'Confirmed', 'Partial', '2026-10-09T18:10:22.540Z', 'SS-2026-00014', 17, 'Event Service Booking', 'Event', '10:00', '22:00', 0, 1, 'Balayan', 'covered court', 'Barangay 8, San Juan, Langgangan, Balayan, Batangas, Calabarzon, 4213, Philippines', 13.936774, 120.738045, NULL, 10, 'downpayment', 255, 255, 5, 25.5, 484.5, NULL, '2026-10-16', '2026-10-16', 1, 0, 500, 0.8, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 29)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (29, 1, 1, 'bundle a for wedding', '2026-10-16', NULL, 'efvfrv, Nasugbu', 760, 'Confirmed', 'Partial', '2026-10-09T18:11:15.883Z', 'SS-2026-00015', 17, 'Event Service Booking', 'Event', '10:00', '22:00', 0, 1, 'Nasugbu', 'efvfrv', 'Barangay 1 (Poblacion), Nasugbu, Batangas', 14.0725, 120.632, NULL, 10, 'downpayment', 380, 380, 5, 38, 722, NULL, '2026-10-16', '2026-10-16', 1, 0, 750, 18.3, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 30)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (30, 1, 1, 'bundle a for wedding', '2026-10-16', NULL, 'rggdr, Nasugbu', 760, 'Confirmed', 'Partial', '2026-10-09T18:14:00.610Z', 'SS-2026-00016', 17, 'Event Service Booking', 'Event', '10:00', '22:00', 0, 1, 'Nasugbu', 'rggdr', 'Barangay 1 (Poblacion), Nasugbu, Batangas', 14.0725, 120.632, NULL, 10, 'downpayment', 380, 380, 5, 38, 722, NULL, '2026-10-16', '2026-10-16', 1, 0, 750, 18.3, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 31)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (31, 1, 1, 'hkcdtusea', '2026-10-15', NULL, 'wcvwrvcw, Nasugbu', 755, 'Confirmed', 'Paid', '2026-10-09T18:17:53.606Z', 'SS-2026-00017', 31, 'Event Service Booking', 'Event', '08:00', '22:00', 0, 1, 'Nasugbu', 'wcvwrvcw', 'Barangay 1 (Poblacion), Nasugbu, Batangas', 14.0725, 120.632, NULL, 5, 'full', 755, 0, 5, 37.75, 717.25, NULL, '2026-10-15', '2026-10-15', 1, 0, 750, 18.3, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 32)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (32, 1, 1, 'hkcdtusea', '2026-10-17', NULL, 'bgyt, Lian', 755, 'Cancelled', 'Partial', '2026-10-09T18:30:21.443Z', 'SS-2026-00018', 31, 'Event Service Booking', 'Event', '08:00', '22:00', 0, 1, 'Lian', 'bgyt', 'Barangay Bagong Pook, Lian, Batangas', 14.038, 120.655, NULL, 5, 'downpayment', 378, 377, 5, 37.75, 717.25, NULL, '2026-10-17', '2026-10-17', 1, 0, 750, 13.7, 'Held', 'Denver Cabrera', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 33)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (33, 1, 1, 'bundle a for wedding', '2026-10-17', NULL, 'covered court, Balayan', 510, 'Completed', 'Paid', '2026-10-09T19:36:16.466Z', 'SS-2026-00019', 17, 'Event Service Booking', 'Event', '08:00', '22:00', 0, 1, 'Balayan', 'covered court', 'Barangay Putol, Balayan, Batangas', 13.965, 120.73, NULL, 10, 'full', 510, 0, 5, 25.5, 484.5, '2026-10-11T14:49:48.983Z', '2026-10-17', '2026-10-17', 1, 0, 500, 2.9, 'Held', 'Andrei Dela Cruz', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 34)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (34, 1, 1, 'Birthday Package', '2026-10-11', NULL, 'Covered Court, Balayan', 1500, 'Cancelled', 'Partial', '2026-10-10T20:47:55.276Z', 'SS-2026-00020', 17, 'Event Service Booking', 'Event', '11:00', '22:00', 0, 1, 'Balayan', 'Covered Court', 'Barangay 8 (Poblacion), Balayan, Batangas', 13.9405, 120.7368, NULL, 1000, 'downpayment', 750, 750, 5, 75, 1425, '2026-10-10T22:49:37.333Z', '2026-10-11', '2026-10-11', 1, 0, 500, 0.7, 'Held', 'Princess Vizconde. Cornejo', '09516028992', 'denvercabrera.apo@gmail.com', '2026-10-10T21:18:27.176Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 35)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (35, 8, 1, 'Birthday Package', '2026-10-11', NULL, 'Covered Court, Balayan', 1500, 'Completed', 'Paid', '2026-10-11T10:14:39.703Z', 'SS-2026-00021', 17, 'Event Service Booking', 'Event', '18:00', '22:00', 0, 1, 'Balayan', 'Covered Court', 'Barangay 8 (Poblacion), Balayan, Batangas', 13.9405, 120.7368, NULL, 1000, 'full', 1500, 0, 5, 75, 1425, '2026-10-11T14:42:32.410Z', '2026-10-11', '2026-10-11', 1, 0, 500, 0.7, 'Held', 'Mariel Fernandez', '09516028992', 'denvercabrera.apo@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 36)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (36, 8, 1, 'Birthday Package', '2026-10-11', NULL, 'plaza, Balayan', 1500, 'Cancelled', 'Paid', '2026-10-11T11:34:07.353Z', 'SS-2026-00022', 17, 'Event Service Booking', 'Event', '20:00', '22:00', 0, 1, 'Balayan', 'plaza', 'Barangay 1 (Poblacion), Balayan, Batangas', 13.9372, 120.7335, NULL, 1000, 'full', 1500, 0, 5, 75, 1425, '2026-10-11T11:44:06.616Z', '2026-10-11', '2026-10-11', 1, 0, 500, 0.3, 'Held', 'Larra Ayroso', '09516028992', 'denvercabrera.apo@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 37)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (37, 8, 1, 'Birthday Package', '2026-10-11', NULL, 'Plaza, Balayan', 1500, 'Cancelled', 'Paid', '2026-10-11T11:34:58.760Z', 'SS-2026-00023', 17, 'Event Service Booking', 'Event', '20:00', '22:00', 0, 1, 'Balayan', 'Plaza', 'Barangay 1 (Poblacion), Balayan, Batangas', 13.9372, 120.7335, NULL, 1000, 'full', 1500, 0, 5, 75, 1425, '2026-10-11T11:43:55.680Z', '2026-10-11', '2026-10-11', 1, 0, 500, 0.3, 'Held', 'larra ayroso', '09516028992', 'dendenescondecabrera17@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 38)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (38, 1, 1, 'wedding package', '2026-10-11', NULL, 'covered court, Balayan', 5500, 'Confirmed', 'Partial', '2026-10-11T15:07:33.796Z', 'SS-2026-00024', 31, 'Event Service Booking', 'Event', '08:00', '22:00', 0, 1, 'Balayan', 'covered court', 'Barangay Caloocan, Balayan, Batangas', 13.946, 120.732, NULL, 5000, 'downpayment', 2750, 2750, 5, 275, 5225, '2026-10-11T15:08:00.946Z', '2026-10-11', '2026-10-11', 1, 0, 500, 0.8, 'Held', 'Joy Anne Pungay. Basco', '09516028992', 'denvercabrera.apo@gmail.com', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Bookings] WHERE [BookingID] = 39)
BEGIN
    INSERT INTO dbo.[Bookings] ([BookingID], [ClientUserID], [ProviderID], [PackageName], [EventDate], [EventTime], [Location], [TotalAmount], [BookingStatus], [PaymentStatus], [CreatedAt], [BookingReference], [PackageID], [EventName], [EventType], [StartTime], [EndTime], [NumberOfHours], [NumberOfDays], [EventPlace], [VenueName], [EventAddress], [EventLatitude], [EventLongitude], [LocationNotes], [PackagePrice], [PaymentType], [AmountPaid], [RemainingBalance], [CommissionRate], [CommissionAmount], [ProviderEarnings], [UpdatedAt], [ServiceStartDate], [ServiceEndDate], [ServiceHireDays], [AdditionalDayCharges], [TransportationFee], [DistanceKm], [EscrowStatus], [ClientName], [ClientPhone], [ClientEmail], [BalanceReminderSentAt])
    VALUES (39, 1, 1, 'wedding package', '2026-10-11', NULL, 'caloocan court, Balayan', 5500, 'Confirmed', 'Partial', '2026-10-11T15:12:16.450Z', 'SS-2026-00025', 31, 'Event Service Booking', 'Event', '08:00', '22:00', 0, 1, 'Balayan', 'caloocan court', 'Barangay Caloocan, Balayan, Batangas', 13.946, 120.732, NULL, 5000, 'downpayment', 2750, 2750, 5, 275, 5225, '2026-10-11T15:12:34.150Z', '2026-10-11', '2026-10-11', 1, 0, 500, 0.8, 'Held', 'Clent Dela Cruz', '09516028992', 'denverescondecabrera17@gmail.com', NULL);
END;
SET IDENTITY_INSERT dbo.[Bookings] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Payments] (30 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Payments] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 1)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (1, 9, 7875, 'PayMongo - Card', 'Paid', 'TXN-TEST-12345', '2026-09-06T12:17:12.823Z', '2026-09-06T12:17:12.823Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 8)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (8, 16, 380, 'PayMongo - GCash', 'Paid', 'TXN-PM-1788681546061', '2026-09-06T15:59:11.180Z', '2026-09-06T15:59:11.180Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 9)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (9, 17, 505, 'PayMongo - GCash', 'Paid', 'TXN-PM-1788699029906', '2026-09-06T20:50:30.720Z', '2026-09-06T20:50:30.720Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 10)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (10, 18, 760, 'PayMongo - GCash', 'Paid', 'cs_ca28698ffb9cc2b6c9636b5a', '2026-09-07T10:21:11.670Z', '2026-09-07T10:21:11.670Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 11)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (11, 19, 760, 'PayMongo - QR PH', 'Paid', 'cs_b1cea087ae67c210c2389a11', '2026-09-07T11:22:14.523Z', '2026-09-07T11:22:14.523Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 12)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (12, 20, 255, 'PayMongo', 'Paid', 'TEST-REF-1789023489520', '2026-09-10T14:58:20.606Z', '2026-09-10T14:58:20.606Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 13)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (13, 21, 255, 'PayMongo', 'Paid', 'cs_cee12cab41d4374733928bec', '2026-09-10T15:03:34.953Z', '2026-09-10T15:03:34.953Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 14)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (14, 22, 505, 'PayMongo', 'Paid', 'cs_41f0f705743d64c6d3cc35e5', '2026-09-10T15:28:27.196Z', '2026-09-10T15:28:27.196Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 15)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (15, 23, 755, 'PayMongo', 'Paid', 'cs_794da469cf517b5491af40e5', '2026-10-06T18:18:50.333Z', '2026-10-06T18:18:50.333Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 16)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (16, 24, 523, 'PayMongo', 'Paid', 'cs_4fb81fe62a7bf63ae8b0e5b8', '2026-10-09T11:12:14.936Z', '2026-10-09T11:12:14.936Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 17)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (17, 25, 512, 'PayMongo', 'Paid', 'cs_9bb4627a31e82cf4f05b02f7', '2026-10-09T11:14:00.553Z', '2026-10-09T11:14:00.553Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 18)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (18, 26, 510, 'PayMongo', 'Paid', 'cs_abee8f3dbe6f66397b92ace1', '2026-10-09T11:24:57.760Z', '2026-10-09T11:24:57.760Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 19)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (19, 27, 510, 'PayMongo', 'Paid', 'cs_a8915c6674eaaf5120c64423', '2026-10-09T18:09:08.110Z', '2026-10-09T18:09:08.110Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 20)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (20, 28, 255, 'PayMongo', 'Paid', 'cs_01c6196a4da1a5b6121094a2', '2026-10-09T18:10:22.560Z', '2026-10-09T18:10:22.560Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 21)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (21, 29, 380, 'PayMongo', 'Paid', 'cs_376432dc6d730801b9617f0e', '2026-10-09T18:11:15.890Z', '2026-10-09T18:11:15.890Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 22)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (22, 30, 380, 'PayMongo', 'Paid', 'cs_ff7624010fa4587e2fb23eda', '2026-10-09T18:14:00.623Z', '2026-10-09T18:14:00.623Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 23)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (23, 31, 755, 'PayMongo', 'Paid', 'cs_4f262f8db363d28ef1ab8976', '2026-10-09T18:17:53.613Z', '2026-10-09T18:17:53.613Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 24)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (24, 32, 378, 'PayMongo', 'Paid', 'cs_c9d2e43ae0c4d867699a8adf', '2026-10-09T18:30:21.453Z', '2026-10-09T18:30:21.453Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 25)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (25, 33, 510, 'PayMongo', 'Paid', 'cs_1f379fa0a7e2cd9c4681dba0', '2026-10-09T19:36:16.483Z', '2026-10-09T19:36:16.483Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 26)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (26, 34, 750, 'PayMongo', 'Paid', 'cs_18ef4b36727edc258448d619', '2026-10-10T20:47:55.296Z', '2026-10-10T20:47:55.296Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 27)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (27, 21, 255, 'PayMongo', 'Paid', 'BAL-SS-2026-00007-1791684172684', '2026-10-11T10:02:52.690Z', '2026-10-11T10:02:52.690Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 28)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (28, 9, 7875, 'PayMongo - Card', 'Paid', 'BAL-SS-2026-00001-1791684630781', '2026-10-11T10:10:30.790Z', '2026-10-11T10:10:30.790Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 29)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (29, 35, 750, 'PayMongo', 'Paid', 'cs_ee9c007de66987e8db2a522a', '2026-10-11T10:14:39.710Z', '2026-10-11T10:14:39.710Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 30)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (30, 35, 750, 'PayMongo', 'Paid', 'BAL-SS-2026-00021-1791685506485', '2026-10-11T10:25:06.486Z', '2026-10-11T10:25:06.486Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 31)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (31, 36, 750, 'PayMongo', 'Paid', 'cs_e3421bb7c3c9a780c00ddac6', '2026-10-11T11:34:07.363Z', '2026-10-11T11:34:07.363Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 32)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (32, 37, 750, 'PayMongo', 'Paid', 'cs_6e6eb85a7ffc25725005e7fc', '2026-10-11T11:34:58.763Z', '2026-10-11T11:34:58.763Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 33)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (33, 37, 750, 'PayMongo', 'Paid', 'BAL-SS-2026-00023-1791689727699', '2026-10-11T11:35:27.700Z', '2026-10-11T11:35:27.700Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 34)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (34, 36, 750, 'PayMongo', 'Paid', 'BAL-SS-2026-00022-1791689779682', '2026-10-11T11:36:19.686Z', '2026-10-11T11:36:19.686Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 35)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (35, 38, 2750, 'PayMongo', 'Paid', 'cs_d655834700232407fc7142f9', '2026-10-11T15:07:33.803Z', '2026-10-11T15:07:33.803Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Payments] WHERE [PaymentID] = 37)
BEGIN
    INSERT INTO dbo.[Payments] ([PaymentID], [BookingID], [Amount], [PaymentMethod], [PaymentStatus], [TransactionReference], [PaidAt], [CreatedAt])
    VALUES (37, 39, 2750, 'PayMongo', 'Paid', 'cs_e4268b15eeeedf6f87aadaa1', '2026-10-11T15:12:16.456Z', '2026-10-11T15:12:16.456Z');
END;
SET IDENTITY_INSERT dbo.[Payments] OFF;

-- --------------------------------------------------------
-- Table: dbo.[ClientWallets] (2 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[ClientWallets] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[ClientWallets] WHERE [WalletID] = 1)
BEGIN
    INSERT INTO dbo.[ClientWallets] ([WalletID], [UserID], [Balance], [CreatedAt], [UpdatedAt])
    VALUES (1, 1, 1028, '2026-10-10T22:40:48.763Z', '2026-10-10T22:49:37.426Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ClientWallets] WHERE [WalletID] = 2)
BEGIN
    INSERT INTO dbo.[ClientWallets] ([WalletID], [UserID], [Balance], [CreatedAt], [UpdatedAt])
    VALUES (2, 8, 0, '2026-10-11T11:43:02.186Z', '2026-10-11T12:24:50.073Z');
END;
SET IDENTITY_INSERT dbo.[ClientWallets] OFF;

-- --------------------------------------------------------
-- Table: dbo.[WalletTransactions] (6 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[WalletTransactions] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[WalletTransactions] WHERE [TransactionID] = 1)
BEGIN
    INSERT INTO dbo.[WalletTransactions] ([TransactionID], [UserID], [Amount], [TransactionType], [Description], [BalanceAfter], [RelatedBookingID], [BookingReference], [CreatedAt])
    VALUES (1, 1, 378, 'REFUND_CREDIT', 'Automatic refund for cancelled booking (Ref: SS-2026-00018)', 378, 32, 'SS-2026-00018', '2026-10-10T22:40:48.776Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[WalletTransactions] WHERE [TransactionID] = 2)
BEGIN
    INSERT INTO dbo.[WalletTransactions] ([TransactionID], [UserID], [Amount], [TransactionType], [Description], [BalanceAfter], [RelatedBookingID], [BookingReference], [CreatedAt])
    VALUES (2, 1, -100, 'REFUND_PAYOUT_REQUEST', 'Payout request #1 via GCash to Denver Cabrera (09516028992) - Sent to Cashier', 278, NULL, NULL, '2026-10-10T22:46:12.540Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[WalletTransactions] WHERE [TransactionID] = 3)
BEGIN
    INSERT INTO dbo.[WalletTransactions] ([TransactionID], [UserID], [Amount], [TransactionType], [Description], [BalanceAfter], [RelatedBookingID], [BookingReference], [CreatedAt])
    VALUES (3, 1, 750, 'REFUND_CREDIT', 'Automatic refund for booking cancelled by client (Birthday Package)', 1028, 34, 'SS-2026-00020', '2026-10-10T22:49:37.496Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[WalletTransactions] WHERE [TransactionID] = 4)
BEGIN
    INSERT INTO dbo.[WalletTransactions] ([TransactionID], [UserID], [Amount], [TransactionType], [Description], [BalanceAfter], [RelatedBookingID], [BookingReference], [CreatedAt])
    VALUES (4, 8, 1500, 'REFUND_CREDIT', 'Automatic refund for booking cancelled by service provider (Birthday Package)', 1500, 37, 'SS-2026-00023', '2026-10-11T11:43:55.696Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[WalletTransactions] WHERE [TransactionID] = 5)
BEGIN
    INSERT INTO dbo.[WalletTransactions] ([TransactionID], [UserID], [Amount], [TransactionType], [Description], [BalanceAfter], [RelatedBookingID], [BookingReference], [CreatedAt])
    VALUES (5, 8, 1500, 'REFUND_CREDIT', 'Automatic refund for booking cancelled by service provider (Birthday Package)', 3000, 36, 'SS-2026-00022', '2026-10-11T11:44:06.630Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[WalletTransactions] WHERE [TransactionID] = 6)
BEGIN
    INSERT INTO dbo.[WalletTransactions] ([TransactionID], [UserID], [Amount], [TransactionType], [Description], [BalanceAfter], [RelatedBookingID], [BookingReference], [CreatedAt])
    VALUES (6, 8, -3000, 'REFUND_PAYOUT_REQUEST', 'Payout request #2 via GCash to Denver Cabrera (09955819060) - Sent to Cashier', 0, NULL, NULL, '2026-10-11T12:24:50.090Z');
END;
SET IDENTITY_INSERT dbo.[WalletTransactions] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Withdrawals] (4 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Withdrawals] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Withdrawals] WHERE [WithdrawalID] = 2)
BEGIN
    INSERT INTO dbo.[Withdrawals] ([WithdrawalID], [ProviderID], [Amount], [PayoutMethod], [AccountName], [AccountReference], [Status], [RequestedAt], [ProcessedAt], [AdminNotes], [BookingID], [PayMongoPayoutID], [Notes], [ProcessedByAdminID])
    VALUES (2, 1, 14962.5, 'GCash / Maya E-Wallet', 'DENVER CABRERA', '09516028992', 'Approved', '2026-09-07T11:41:26.477Z', '2026-09-10T15:34:02.773Z', NULL, NULL, NULL, NULL, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Withdrawals] WHERE [WithdrawalID] = 3)
BEGIN
    INSERT INTO dbo.[Withdrawals] ([WithdrawalID], [ProviderID], [Amount], [PayoutMethod], [AccountName], [AccountReference], [Status], [RequestedAt], [ProcessedAt], [AdminNotes], [BookingID], [PayMongoPayoutID], [Notes], [ProcessedByAdminID])
    VALUES (3, 1, 14962.5, 'GCash / Maya E-Wallet', 'DENVER CABRERA', '09516028992', 'Rejected', '2026-09-07T11:41:26.490Z', '2026-09-07T11:42:54.727Z', 'Duplicate submission of WD-2', NULL, NULL, NULL, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Withdrawals] WHERE [WithdrawalID] = 4)
BEGIN
    INSERT INTO dbo.[Withdrawals] ([WithdrawalID], [ProviderID], [Amount], [PayoutMethod], [AccountName], [AccountReference], [Status], [RequestedAt], [ProcessedAt], [AdminNotes], [BookingID], [PayMongoPayoutID], [Notes], [ProcessedByAdminID])
    VALUES (4, 1, 479.75, 'GCash / Maya E-Wallet', 'jenny de jesus', '09955819060', 'Approved', '2026-09-10T16:18:14.937Z', '2026-09-10T20:43:20.113Z', NULL, 22, NULL, NULL, NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Withdrawals] WHERE [WithdrawalID] = 5)
BEGIN
    INSERT INTO dbo.[Withdrawals] ([WithdrawalID], [ProviderID], [Amount], [PayoutMethod], [AccountName], [AccountReference], [Status], [RequestedAt], [ProcessedAt], [AdminNotes], [BookingID], [PayMongoPayoutID], [Notes], [ProcessedByAdminID])
    VALUES (5, 1, 486.4, 'GCash / Maya E-Wallet', 'denver cabrera', '09516028992', 'Approved', '2026-10-09T11:22:16.710Z', '2026-10-11T14:34:52.623Z', 'Cashier confirmed manual payout sent | Ref: 09516028992', 25, NULL, NULL, NULL);
END;
SET IDENTITY_INSERT dbo.[Withdrawals] OFF;

-- --------------------------------------------------------
-- Table: dbo.[RefundRequests] (2 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[RefundRequests] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[RefundRequests] WHERE [RefundRequestID] = 1)
BEGIN
    INSERT INTO dbo.[RefundRequests] ([RefundRequestID], [UserID], [ClientName], [ClientEmail], [ClientPhone], [Amount], [PayoutMethod], [AccountName], [AccountNumber], [Status], [ReferenceNumber], [AdminNotes], [RequestedAt], [ProcessedAt], [ProcessedBy], [BookingID], [BookingReference])
    VALUES (1, 1, 'Denver Cabrera', 'denverescondecabrera17@gmail.com', '09516028992', 100, 'GCash', 'Denver Cabrera', '09516028992', 'Approved', 'GCASH-REF-998822', 'Manually transferred via GCash Express', '2026-10-10T22:46:12.526Z', '2026-10-10T22:47:01.640Z', 35, 34, 'SS-2026-00020');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[RefundRequests] WHERE [RefundRequestID] = 2)
BEGIN
    INSERT INTO dbo.[RefundRequests] ([RefundRequestID], [UserID], [ClientName], [ClientEmail], [ClientPhone], [Amount], [PayoutMethod], [AccountName], [AccountNumber], [Status], [ReferenceNumber], [AdminNotes], [RequestedAt], [ProcessedAt], [ProcessedBy], [BookingID], [BookingReference])
    VALUES (2, 8, 'Denver Cabrera', 'dendenescondecabrera17@gmail.com', '09516028992', 3000, 'GCash', 'Denver Cabrera', '09955819060', 'Pending', NULL, 'hello', '2026-10-11T12:24:50.080Z', NULL, NULL, 36, 'SS-2026-00022');
END;
SET IDENTITY_INSERT dbo.[RefundRequests] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Reviews] (3 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Reviews] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Reviews] WHERE [ReviewID] = 2)
BEGIN
    INSERT INTO dbo.[Reviews] ([ReviewID], [BookingID], [UserID], [ProviderID], [Rating], [ReviewText], [SubmittedAt])
    VALUES (2, 18, 8, 1, 5, 'Outstanding sound quality and very professional light technicians! Made our wedding night unforgettable.', '2026-10-09T21:47:30.173Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Reviews] WHERE [ReviewID] = 3)
BEGIN
    INSERT INTO dbo.[Reviews] ([ReviewID], [BookingID], [UserID], [ProviderID], [Rating], [ReviewText], [SubmittedAt])
    VALUES (3, 9, 8, 13, 4, 'its good', '2026-10-09T21:52:57.940Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Reviews] WHERE [ReviewID] = 4)
BEGIN
    INSERT INTO dbo.[Reviews] ([ReviewID], [BookingID], [UserID], [ProviderID], [Rating], [ReviewText], [SubmittedAt])
    VALUES (4, 23, 8, 1, 3, 'its good', '2026-10-09T21:53:39.410Z');
END;
SET IDENTITY_INSERT dbo.[Reviews] OFF;

-- --------------------------------------------------------
-- Table: dbo.[ProviderSubscriptions] (3 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[ProviderSubscriptions] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderSubscriptions] WHERE [SubscriptionID] = 1)
BEGIN
    INSERT INTO dbo.[ProviderSubscriptions] ([SubscriptionID], [ProviderID], [UserID], [PlanType], [PlanName], [Price], [BillingCycle], [Status], [StartDate], [EndDate], [HasUsedFreeTrial], [PayMongoSessionID], [CreatedAt], [UpdatedAt])
    VALUES (1, 1, 13, 'free_trial', 'Free Trial (1st Month)', 0, '30_days', 'Active', '2026-09-18T15:48:17.600Z', '2026-10-18T15:48:17.600Z', 1, NULL, '2026-09-18T15:48:17.600Z', '2026-09-18T15:48:17.600Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderSubscriptions] WHERE [SubscriptionID] = 2)
BEGIN
    INSERT INTO dbo.[ProviderSubscriptions] ([SubscriptionID], [ProviderID], [UserID], [PlanType], [PlanName], [Price], [BillingCycle], [Status], [StartDate], [EndDate], [HasUsedFreeTrial], [PayMongoSessionID], [CreatedAt], [UpdatedAt])
    VALUES (2, 1, 13, 'monthly', 'Monthly Plan (₱199)', 199, 'monthly', 'Active', '2026-09-18T15:59:23.860Z', '2026-10-18T15:59:23.860Z', 1, 'cs_sub_1789718363851', '2026-09-18T15:59:23.860Z', '2026-09-18T15:59:23.860Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ProviderSubscriptions] WHERE [SubscriptionID] = 3)
BEGIN
    INSERT INTO dbo.[ProviderSubscriptions] ([SubscriptionID], [ProviderID], [UserID], [PlanType], [PlanName], [Price], [BillingCycle], [Status], [StartDate], [EndDate], [HasUsedFreeTrial], [PayMongoSessionID], [CreatedAt], [UpdatedAt])
    VALUES (3, 1, 13, 'monthly', 'Pro Monthly Plan', 499, 'monthly', 'Active', '2026-10-09T10:38:52.433Z', '2026-11-17T15:59:23.860Z', 1, 'CASHIER-CASH-TEST-2395', '2026-10-09T10:38:52.433Z', '2026-10-09T10:38:52.433Z');
END;
SET IDENTITY_INSERT dbo.[ProviderSubscriptions] OFF;

-- --------------------------------------------------------
-- Table: dbo.[SubscriptionPayments] (2 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[SubscriptionPayments] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[SubscriptionPayments] WHERE [PaymentID] = 2)
BEGIN
    INSERT INTO dbo.[SubscriptionPayments] ([PaymentID], [SubscriptionID], [ProviderID], [PlanType], [PlanName], [Amount], [Currency], [PaymentMethod], [PayMongoSessionID], [PayMongoPaymentID], [PaymentStatus], [PaymentDate], [Notes])
    VALUES (2, 2, 1, 'monthly', 'Monthly Plan (₱199)', 199, 'PHP', 'PayMongo (GCash / Maya / Card)', 'cs_sub_1789718363851', NULL, 'Paid', '2026-09-18T15:59:23.870Z', 'Official Subscription Payment Receipt for CHiCHa Lights and Sounds');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[SubscriptionPayments] WHERE [PaymentID] = 3)
BEGIN
    INSERT INTO dbo.[SubscriptionPayments] ([PaymentID], [SubscriptionID], [ProviderID], [PlanType], [PlanName], [Amount], [Currency], [PaymentMethod], [PayMongoSessionID], [PayMongoPaymentID], [PaymentStatus], [PaymentDate], [Notes])
    VALUES (3, 3, 1, 'monthly', 'Pro Monthly Plan', 499, 'PHP', 'Over-the-Counter Cash', 'CASHIER-CASH-TEST-2395', NULL, 'Paid', '2026-10-09T10:38:52.440Z', 'Test In-Person Cashier collection | Collected by Cashier. Ref: CASHIER-CASH-TEST-2395');
END;
SET IDENTITY_INSERT dbo.[SubscriptionPayments] OFF;

-- --------------------------------------------------------
-- Table: dbo.[TransportationFees] (6 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[TransportationFees] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[TransportationFees] WHERE [FeeID] = 1)
BEGIN
    INSERT INTO dbo.[TransportationFees] ([FeeID], [MinDistanceKm], [MaxDistanceKm], [ServiceFee], [IsActive], [CreatedAt])
    VALUES (1, 0, 10, 500, 1, '2026-09-03T20:48:56.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[TransportationFees] WHERE [FeeID] = 2)
BEGIN
    INSERT INTO dbo.[TransportationFees] ([FeeID], [MinDistanceKm], [MaxDistanceKm], [ServiceFee], [IsActive], [CreatedAt])
    VALUES (2, 10.01, 20, 750, 1, '2026-09-03T20:48:56.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[TransportationFees] WHERE [FeeID] = 3)
BEGIN
    INSERT INTO dbo.[TransportationFees] ([FeeID], [MinDistanceKm], [MaxDistanceKm], [ServiceFee], [IsActive], [CreatedAt])
    VALUES (3, 20.01, 30, 1000, 1, '2026-09-03T20:48:56.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[TransportationFees] WHERE [FeeID] = 4)
BEGIN
    INSERT INTO dbo.[TransportationFees] ([FeeID], [MinDistanceKm], [MaxDistanceKm], [ServiceFee], [IsActive], [CreatedAt])
    VALUES (4, 30.01, 40, 1250, 1, '2026-09-03T20:48:56.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[TransportationFees] WHERE [FeeID] = 5)
BEGIN
    INSERT INTO dbo.[TransportationFees] ([FeeID], [MinDistanceKm], [MaxDistanceKm], [ServiceFee], [IsActive], [CreatedAt])
    VALUES (5, 40.01, 50, 1500, 1, '2026-09-03T20:48:56.273Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[TransportationFees] WHERE [FeeID] = 6)
BEGIN
    INSERT INTO dbo.[TransportationFees] ([FeeID], [MinDistanceKm], [MaxDistanceKm], [ServiceFee], [IsActive], [CreatedAt])
    VALUES (6, 50.01, 999, 2000, 1, '2026-09-03T20:48:56.273Z');
END;
SET IDENTITY_INSERT dbo.[TransportationFees] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Conversations] (4 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Conversations] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Conversations] WHERE [ConversationID] = 3)
BEGIN
    INSERT INTO dbo.[Conversations] ([ConversationID], [User1ID], [User2ID], [BookingID], [ApplicationID], [CreatedAt], [UpdatedAt])
    VALUES (3, 1, 2, NULL, NULL, '2026-09-19T16:05:15.750Z', '2026-10-09T11:20:04.870Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Conversations] WHERE [ConversationID] = 4)
BEGIN
    INSERT INTO dbo.[Conversations] ([ConversationID], [User1ID], [User2ID], [BookingID], [ApplicationID], [CreatedAt], [UpdatedAt])
    VALUES (4, 8, 13, NULL, NULL, '2026-09-19T16:08:59.676Z', '2026-09-19T19:24:10.776Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Conversations] WHERE [ConversationID] = 5)
BEGIN
    INSERT INTO dbo.[Conversations] ([ConversationID], [User1ID], [User2ID], [BookingID], [ApplicationID], [CreatedAt], [UpdatedAt])
    VALUES (5, 4, 13, NULL, NULL, '2026-09-19T18:53:56.486Z', '2026-10-09T09:55:24.870Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Conversations] WHERE [ConversationID] = 6)
BEGIN
    INSERT INTO dbo.[Conversations] ([ConversationID], [User1ID], [User2ID], [BookingID], [ApplicationID], [CreatedAt], [UpdatedAt])
    VALUES (6, 1, 13, NULL, NULL, '2026-10-09T12:12:03.066Z', '2026-10-10T14:34:11.130Z');
END;
SET IDENTITY_INSERT dbo.[Conversations] OFF;

-- --------------------------------------------------------
-- Table: dbo.[ConversationParticipants] (8 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[ConversationParticipants] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[ConversationParticipants] WHERE [ParticipantID] = 5)
BEGIN
    INSERT INTO dbo.[ConversationParticipants] ([ParticipantID], [ConversationID], [UserID], [JoinedAt], [LastReadAt])
    VALUES (5, 3, 1, '2026-09-19T16:05:15.753Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ConversationParticipants] WHERE [ParticipantID] = 6)
BEGIN
    INSERT INTO dbo.[ConversationParticipants] ([ParticipantID], [ConversationID], [UserID], [JoinedAt], [LastReadAt])
    VALUES (6, 3, 2, '2026-09-19T16:05:15.756Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ConversationParticipants] WHERE [ParticipantID] = 7)
BEGIN
    INSERT INTO dbo.[ConversationParticipants] ([ParticipantID], [ConversationID], [UserID], [JoinedAt], [LastReadAt])
    VALUES (7, 4, 8, '2026-09-19T16:08:59.680Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ConversationParticipants] WHERE [ParticipantID] = 8)
BEGIN
    INSERT INTO dbo.[ConversationParticipants] ([ParticipantID], [ConversationID], [UserID], [JoinedAt], [LastReadAt])
    VALUES (8, 4, 13, '2026-09-19T16:08:59.680Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ConversationParticipants] WHERE [ParticipantID] = 9)
BEGIN
    INSERT INTO dbo.[ConversationParticipants] ([ParticipantID], [ConversationID], [UserID], [JoinedAt], [LastReadAt])
    VALUES (9, 5, 4, '2026-09-19T18:53:56.496Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ConversationParticipants] WHERE [ParticipantID] = 10)
BEGIN
    INSERT INTO dbo.[ConversationParticipants] ([ParticipantID], [ConversationID], [UserID], [JoinedAt], [LastReadAt])
    VALUES (10, 5, 13, '2026-09-19T18:53:56.500Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ConversationParticipants] WHERE [ParticipantID] = 11)
BEGIN
    INSERT INTO dbo.[ConversationParticipants] ([ParticipantID], [ConversationID], [UserID], [JoinedAt], [LastReadAt])
    VALUES (11, 6, 1, '2026-10-09T12:12:03.090Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[ConversationParticipants] WHERE [ParticipantID] = 12)
BEGIN
    INSERT INTO dbo.[ConversationParticipants] ([ParticipantID], [ConversationID], [UserID], [JoinedAt], [LastReadAt])
    VALUES (12, 6, 13, '2026-10-09T12:12:03.106Z', NULL);
END;
SET IDENTITY_INSERT dbo.[ConversationParticipants] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Messages] (15 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Messages] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 6)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (6, 3, 1, 2, NULL, 'Hello Provider! Can we confirm availability for August 15?', '2026-09-19T16:05:15.770Z', 0, NULL, 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 7)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (7, 3, 2, 1, NULL, 'Hello Denver! Yes, our line array system is fully available for August 15. We would be happy to cater your event!', '2026-09-19T16:05:57.260Z', 1, '2026-09-19T16:05:57.283Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 8)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (8, 3, 1, 2, NULL, 'Hello Provider! Can we confirm availability for August 15?', '2026-09-19T16:08:17.910Z', 0, NULL, 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 9)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (9, 4, 8, 13, NULL, 'hello', '2026-09-19T16:09:17.530Z', 1, '2026-09-19T18:55:12.090Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 10)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (10, 5, 13, 4, NULL, 'hello', '2026-09-19T18:55:24.740Z', 1, '2026-10-08T10:08:00.596Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 11)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (11, 4, 13, 8, NULL, 'hi', '2026-09-19T18:55:34.740Z', 1, '2026-09-19T18:56:33.913Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 12)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (12, 4, 8, 13, NULL, 'IMAGE_ATTACHMENT:data:image/jpeg;base64,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7pUezT3ddFXhbF90qPZporlxZKKtvd10U+FsX3So9mnu66KvC2L7pUezTRXLiyTyLX4f+ISed1P771wx066Kcv72xfdKj2ahWbTfougpHslxXE1xqJ3gcEn5HSvcD/Z9ohNFcuLWRVt7uuirwti+6VHs093XRT4WxfdKj2aaK5cWSirb3ddFXhbF90qPZp7uuinwti+6VHs00Vy4slFW3u66KfC2L7pUezT3ddFXhbF90qPZporlxZKKtvd10U+FsX3So9mnu66KvC2L7pUezTRXLiyUVbe7rop8LYvulR7NPd10U+FsX3So9mmiuXFkoq293XRV4WxfdKj2ae7rop8LYvulR7NNFcuO5xB8Qj87pv32LYDkVU3nTfounpGRxYric4VMDyOCT8jZWOJ+B2gVN93XRTl/e2L7nUezTRXLiyUVbe7rop8LYvulR7NPd10VeFsX3So9mmiuXFkoq293XRT4WxfdKj2ae7roq8LYvulR7NNFcuLJRVt7uuinwti+6VHs093XRT4WxfdKj2aaK5cWSirb3ddFXhbF90qPZp7uuinwti+6VHs00Vy4slFW3u66KvC2L7pUezT3ddFPhbF90qPZporlxZKKtvd10U+FsX3So9mnu66KvC2L7pUezTRXLju4+z8/msXryKcqrj036LReJpziuLrbqdjQ7gk+0hzyR8DxhS/d10VeFsX3So9mmiuXFkoq293XRT4WxfdKj2ae7rop8LYvulR7NNFcuLJRVt7uuirwti+6VHs093XRT4WxfdKj2aaK5cWSirb3ddFXhbF90qPZp7uuinwti+6VHs00Vy4slFW3u66KfC2L7pUezT3ddFXhbF90qPZporlxZKKtvd10U+FsX3So9mnu66KvC2L7pUezTRXLiyVg8irf3ddFPhbF90qPZrB06aKfC2L7pUezTRXLju7B2Ip/mn0lT1Vdo04aLoLbDFLiuJr2jaOCTnf8xS/d10U+FsX3So9mmiuXFkoq293XRV4WxfdKj2ae7rop8LYvulR7NNFcuLJRVt7uuinwti+6VHs093XRV4WxfdKj2aaK5cWSirb3ddFPhbF90qPZp7uuirwti+6VHs00Vy4slFW3u66KfC2L7pUezT3ddFPhbF90qPZporlxZKKtvd10VeFsX3So9mnu66KfC2L7pUezTRXLiyVWPVC9icKfSig9cr6+7roq8LYvulR7NcXpU0l4Jxh/Ra04bvbbhWjEdFKYmU0zSGNftObmAbFrccZifxfoRYCyViAIUTegjuoqNzi91JAXHaSYxmVjgNDn8Tp+bCkoEEfgFD3HT82FgUND3HT82FJKII5oaHuOn5sJwGh7jp+bCkb0QRuA0OfxOn5sLPAKHuOn5sKQEKCMKGh7jp+bCyaGh7jp+bCkJvQR+A0PcdPzYWOA0OfxOn5sKSgQR+AUPcdPzYWOA0J/+Tp+bHQpJRBG4DQ9x0/NhZ4DQ9x0/NhSN6II3AaHP4nT82FngFD3HT82FICFBGFDQ9x0/NhZNDQ9x0/NhSE3oI/AaHuOn5sLHAaHP4nT82FJQII/AKHuOn5sLAoaHuOn5sKSUQRzQ0PcdPzYTgND3HT82FI3ogjcBoc/idPzYWeAUPcdPzYUgIUEYUND3HT82Fk0ND3HT82FITegj8Boe46fmwscBoc/idPzYUlAgj8Aoe46fmwsChoe46fmwpJRBHNDQ9x0/NhOA0PcdPzYUjeiCNwGhz+J0/NhZ4BQ9x0/NhSAhQRhQ0PcdPzYWTQ0PcdPzYUhN6CPwGh7jp+bCxwGhz+J0/NjoUlAgj8Aoe46fmwsChoe46fmwpJRBHNDQ9x0/NhOA0PcdPzYUjeiCNwGhz+J0/NhZ4BQ9x0/NhSAhQRhQ0PcdPzYWTQ0PcdPzYUhN6CPwGh7jp+bCxwGhz+J0/NhSUCCPwCh7jp+bCwKGh7jp+bCklEEY0ND3HT82OhZ4DQ9x0/NhSN6II3AaHP4nT82FngFD3HT82FICFBGFDQ9x0/NhZNDQ9x0/NhSE3oI/AaHuOn5sLHAaHP4nT82FJQII/AKHuOn5sLAoaHuOn5sKSUQRzQ0PcdPzYTgND3HT82FI3ogjcBoc/idPzYWeAUPcdPzYUgIUEbgNCf/AJOn5sdCyaGh7jp+bCkJvQR+A0PcdPzYWOA0OfxOn5sKSgQR+AUPcdPzYWBQ0PcdPzYUkogjmhoe46fmwnAaHuOn5sKRvRBG4DQ5/E6fmws8Aoe46fmwpAQoIwoaHuOn5sLJoaHuOn5sKQm9BH4DQ9x0/NhY4DQ55cDp+bHQpKBBH4BQ9x0/NhYFDQ9x0/NhSSiCOaGh7jp+bCcBoe46fmwpG9EEbgNDn8Tp+bCzwCh7jp+bCkBCgjChoe46fmwsmhoe46fmwpCb0EfgND3HT82FjgNDn8Tp+bCkoEEfgFD3HT82FgUND3HT82FJKII5oaHuOn5sI2io2uDm0kAcNoIjGYUjeiBvRAhQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERAREQEREBERB//9k=', '2026-09-19T19:18:20.746Z', 1, '2026-10-07T16:47:08.456Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 13)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (13, 4, 8, 13, NULL, 'IMAGE_ATTACHMENT:data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAUDBAQEAwUEBAQFBQUGBwwIBwcHBw8LCwkMEQ8SEhEPERETFhwXExQaFRERGCEYGh0dHx8fExciJCIeJBweHx7/2wBDAQUFBQcGBw4ICA4eFBEUHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh4eHh7/wAARCAEXAyADASIAAhEBAxEB/8QAHQABAAICAwEBAAAAAAAAAAAAAAcIAQYEBQkDAv/EAEcQAAEDAwIDBQUFBQYFAgcAAAABAgMEBQYHERIhMQgTQVFhFCIycYFCUmKRoRUjJHKxFjNjgpLBF0NT0fAJsiU0c4OTotL/xAAWAQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAWEQEBAQAAAAAAAAAAAAAAAAAAEQH/2gAMAwEAAhEDEQA/ALlgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAxxJ5nX3++Wiw22S43q401BSRp70s8iNb8ufVfQDsd0G6b7blb837W+EWipdS4/ba6/OaqoszVSGHl5KvNfohMGkWd2/UbC6TJ7bBLTxTK5j4pPije1dlTdOvzA3AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYcu3M+FbW01DSyVVbPFTwRornySPRrWp6qoH3Vdjg3y9Wqx26S4Xevp6GliTd8s8iMan5leNY+1bjlh7+24NC2+3Ju7Vq37pSRL03RU5yL8tk9fAqJn2oGXZ5cFrcnvVRWrv7kSrwxR+jWJyRPoWItRq52trbQd/bNPKBLjVc2/tGqarYGerGdXr6rsnzKoZvm2V5rcnXDJ75VXCXqjZHe41PJrE5NT5IdA1rnuRrEVXKuyIidVLEaBdma95a6C+5n31msS7PZT7bVNUnyX4Geq818E8RCou0h0synUy+sobJSKyka5Paa6RFbDAnqviu3gm6no5prh9swTDbfjNqRVp6OPZZFTZ0r1+J6+qrzOdiuOWXFrLBZ7Bb4KCigTZkUTdvqq+K+qnbEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAvJNwCmHOVE32+a7msag55i+B2R91yi7QUUO37tirxSzO8GsYnNy/wDi7JzKXa09pvKMyWW1Yu2awWd27fcf/EzN/E5Ph+SfmVFldau0HhmncUlDDK2931E92hpnpwxr5yP5o1PTmpTbULVDUbVu8JQ1E9TLBK/aC1UEbuDryThTdXL6qqnc6TaBZLmNKuSZJVJjOMM3lluFcvC+VvVXMa7w/E7ZPLc5Wa6mYriFDPiujNB7NAqLFV5DKm9VV+C92q82sX6Kvkgg0W94nQYdFwZTWRVF9em6WeklR7qfdOtTInJq/wCG3d3mrfHgYPhuTagZElsxq0vqp5Hbu4G8MULd9t3O6NanqSRoFoDkmpVU293lZ7Xjqu4n1cqL3tWu/NIkXr6vXl81L04DhmOYRYYrPjdtioqdqJxKie/I77z3dVX5gRXob2cMYwJkN1vnd3y/ps5ZZGfuIHeUbF6/zLz+ROiNTlty2M8KGSLAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/KuUOcqKvkidSsHaX7SUGPvqMUwGpjqruxVZVXBmzo6ZfFrF6OenivROnXoTVn+Lnsfoob2SM6zq6a4UVJV364XCnrmyLWRTzOkYrUbvxIi8k25dC+QMAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA1TUrPsY0+sb7tktzjpWLukEKLvLO77rG9V/oniBs8kjY43PkejGtRVVVXZETzK3649qOy44tRZcF7i93Ru7H1m+9LAvov23J6cvVSAtdO0BlOo8slrt75bTj7ncPscL14508O8VOu/3enzNi0L7MV+yv2e9Zl31lsztnsp1T+Jnb8l+BF9efoXE1GFDRaia05m7ukrr7c5V3fI9do6dir9pV91jU8v6llsW0i010OxxuYanXCnulzj96GFW8UfeIm/BFGvxu9V5J1XZDcNQtQ9Oez9i7cex23Ur7srN4rfAqK9V/6k7uv5818Cnl2umf6259G16VF3utSu0NPFyip2b9EToxict1X6hHea4605PqncP2dTRzUNjR6NprbCqqr+fu8e3xO9OieBMPZy7Mrt6bKtSKXZztpKa0PTmnk6byX8H5+RJHZ67Pdl08jhvd8SG65IrUXvVbvFSr5R7+P4upOjee/Ii4/FNDFDAyCGJkccbUY1jW7Na1OiInlsfVOXQAKAAAAAAAAAAAAAAAAAAAAcK83O22e3y3G7V9NQUcLd5J6iVI42J6qvIDmn4c7h3VVRETxVStWp3a1xazLLQ4ZSPv1Wm7UqZN46dF8039535IVszLVzVLUuu/Zst0r5m1DuFlttjHNa/wBOFnN313EF4c/1x00wpZIbnklPVVrN96OgX2iZFTwVG8mr/MqEB5n2yK18kkOI4vDFEnJJ66Xif8+BvJPkqqaDgPZb1IyNIqi7U8GPUjtl3rF4ptl/w280+SqhPuE9k7T6zsa+/T1t+qOSqj391F/pbz/UrKuly7TWrlZUd82/Q0rUXfggpWtb8ue+5ImhvaezW5ZraccymmpblT3GpZTJLDFwTRq5dkXZOTuaoWcs2l+nVopvZ6HCbCxm2276Jkjl+bnoq/qfOzaV6eWbK25Na8Ut1JdGovBLExWtZuioqtZvwouy9UQK3Rir57n6AIofh6qi/wBTLyn/AGtdf1kdV4HhFd7ibxXKvifyd4OiY5PyVU+QTWO1R2iHTSVmEYFWrwoqw19yhdzVeisiVPyVyfQqS5q9XI5F68/XnuSHiOH01uxB+oGXQu/ZKOWG10bl2dcp+m3pG1ebl8eiH40ewe6asalQ2xEVsMj1nuE7GIjYYd+aIicm+TUTknIqLE9gfT+WkttfqFcIXMWs3pbejk2VY2r+8kT0VycKfyuLYHX2K10Nks9HaLbA2no6OFsMEbE91rGpsiHYDVwABFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMLsq+BxLzcqC022e43OripKSBivlmldwtYieKqUv7Q3abrr8lTjWn8ktBa13jqLjvwzTpz3Rnixq+fVfQJqXdfu0dYMHbPZMbfDeMhbu1yNdvDTO/GqdXJ91PrsVAhh1B1qzxV/jL5dpvjc7+6p49/PpGxP/NzbtCNAcm1Jniutx7+1Y/xbuq5W+/Om/NI0Xr/N0LpWm14Boxgj+4bSWa1U6bzTP27yd+3Vzur3r4fpyNI0LQjs6Y1gLIb3kKQXjIGIj2yPb+4pXfgavLdPvL9NjVu0R2nKSypUY3p9NHV3JN457lydFAvTaPwc5PPonqRR2g+0dfM6Saw4y+W046/dj3NXaesb+Jfst/CnXx36HJ7PnZuu+ZPp79mKVFrsLlR7IduGoq068t/havmvPnyIND0p0yzXWLJZqqJ0zoHy8ddd6tXORFXr73VzvQvrpBpjjGmljS32Kl4qiRE9qrZUTvp3J5r4J5InJDZscsdrx2009ostBBQUFM3gihhbwtRP919V5qdmRcAAFAAAAAAAAAAAAAAAAAN0MPcjWqqqiIibruBndPM4l2uNBarfLX3OsgpKSFOKSaaRGMYnmqryQhTWbtJ4fg/e22zObf7yzdvdQP8A3MS/jen9EKh5bmepetOSx0kz626SudvT22jYqQQ/Jqck683O8+oFkdW+1nZLSs1uwOi/bFWm7fbJt207V82p1d+hWu43PVPWvI0ifJc8gqVdvHBE1Up4E/l+Bieq/mpOmkHZHWTurlqNWOa3k79mUb9lX0fJ4fJv5lqMVxqxYtaY7Xj1opLZRxpyip40ai+qr1cvqu6lRVXS/shSypFXZ/de5byctBQ83L6OevT6IWbwXA8Rwij9lxiw0dvRU2fKxm8sn8z195fqps7eSGSKN6IAAAAXkAPy/b8g5UVNupV7tb69rj8VTg+GVm12lbwV9bGu60zF6sYvg9U8fs+HPmhHWdrLX51N7VgWDVu067xXK4QrzZ4OijVPHwVydPAiLQvSqhu1qqNQc/kfbsJtid4/i911c5F/u2dN0VeW6dV5Ifbs5aLvz+rkyfKnvo8RoOKWqmkk4faeHmrUcvRvm7y6Hw7SGqzc4ucGLYnF7HiFqVIaGmhbwpO5vuo/hTw8ET/uaRrupGWXnVrPqSmtNufHTI5tDY7XCiI2ni6NaiJyRem69E+SF5uztpZR6X4Uyickc95rNpbjUonV+3Jjfwt6eq7qaH2R9EW4ZbY8vyWlRcgq4/3ET050ca/0eqdfLoWMTohNXAAEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC8k3AKqJ1OhznK7Fh2Oz36/wBbHS0cCc3O6vd4Naniq+RysqvtrxuwVl7vNUyloaSNZJZX9ERPLzVV5Ih53az6l5PrPnbIKSnqfYEm7m1WyLmqIq7buROr3dVXw6BHJ141qyXVe9Lb6Rs9HYWS8NHbolVXSrvyfJt8Tl8uieq81l3s5dmNHezZTqRT8t0kprOvRV6os3/8/n5LuXZ70MsWmNo/tlnMtJJe2x94qzvb3Fvb5Iq8lf5u+idN10zXztTq5s2P6aO4UVVZPeHp4eULV/8Acv0TxNImfWLWjDdK7ctCroqy6sj2p7XSKiKzwTj25Mb/AObFIc6zTPNaMyiZUrUVk8r+CitlK1VigRV6Nb/Vy8/M5uk+kucauXt1VF30dE6TirLtV7q3dV57KvN7vRF/IvBpdpngukdj2o0p4qh6IlTc617UllXy4l2RqfhT9QqM+zv2ZbZi7qfJM6ihud5aiPp6JdlgpV8HOTo96evJPLfmlk2t4UREREaictji2u6225wrNba6mrI0XZXwSteiL80U5auTZSLWd0M7kFas9pjCMGukloooZ7/cYncMzKVyNiiXxRz18fki/QkbSbPbTqNhlNk9ojmhgle6KSGbbjikb1au3Jeqc/UhW3g1Sr1GwekylmMVGT2yO8PcjEpFmTj4l6N9F9DaUcip0BX6MKqIuw4jh3m4UtrtdXcqyRIqalhdNK9V22a1N1/oBzFVEMlStLe1BkmVaw0ON1lmtDLLdKv2an7lsiTR7rsxyuVyo7w391PTYszmWW49h1o/auSXSC3UfGkaSSrtxPXo1E6qvJfyBXeA6fE8mseVWeO74/cYLhQyKqNlidum6dU9FTyOZdLpbrVRvrLlWwUdMz4pZ5EY1PqoHMCrsa5XZ3hlFb0uFVlFoipVTiSRatmyp9FIf1E7V2A4+joMdhnyWsRekLu5g/8AyKi7/RFAsGiooNH0T1Ft+p+EsyWgo5aL986CankdxLHI3bdOLZN02VOexvAAwrkQ/MsjI2q97ka1qbq5V2RE81K268dqCzYws9jwZYbxd+bH1budNTL6f9RyeSck8V8AJm1M1ExXT2zOuOSXCODdP3NO1d5Zl8mt6r8+hSTWvtE5lqDLJaLM6SxWJ7uBKamX9/UJ0TvHpz5/dbsnnuajj1g1F1rzGaWFa28V0rk7+sncqRQJ5qvRqeifRC5uhnZ5xPT2GK5XCOO95EiIq1kzP3cK+UTF5J/MvP5dCpquuivZiyfMe6uuVySWC0PXjRrmb1MyejV+FPV35Fy9O9P8UwG0ttuMWiGjZt+8mVOKaZfN715r/RPBDaGt28f0P0QxhqKimQAoAAAAAGHdOZlV2Tci7tFasW/S7DX1KLHNe6tFjt1Kq83O8XuT7rf16A1p3at1xjwG1vxnHZ435LWRLxSboqUUap8a/jX7KeHVfJaz9nfSC66sZPJXXWWeGwwS95cK1yrxzqq7qxir1c7xVem+/odNppheU606kyxSVE0r55faLpcJOaQMVebl9V6I3+nUm3X7Vmx6fYimkmlrmQdxF3FfXQrusSfba1ydZHc+J3huu3Pppl0fas1Zt/sDNKsAdFR2GgRIax9NybMreSRIqdWoqbr95TWezRHppi1czO9QrzTJNTP3tluYxZXo9P8Amuanl9lF8efghC1FS1tfWNpqSCWpqJVRGRRsVznO8kROak2YD2XdSMkibU3KKmx2lciOR9a5Vk2/kbz/AD2CrS4n2jdK8ju0dtpr5LSzyuRka1cDomPVeiI5eW6kvoqbIiHlPqBY6HGsyrrHbLyl4jopUiWsjj4GvkTbi4U3XdEXdN9+ex6Z6VMujNMsXbenPdcktFKlUr9+JZO6bxcW/jvvv6k0xsxjdDp8xyeyYlYKi+X+ujoqKBu7nvXmq+CIniq+SFaIO2NbpcxZTLickWPul7tat1VvUI3fbvODbhRPHh3+vgRVsAfCiqoqukhqoHpJFMxHscni1U3RT7K5AMgwiovQyAAAAGNwjt/AFZAAABTG4GQEUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAL0PjPURU8Tpp5GRRMTdz3uRGonqpCmpHae04xKd9FQzz5FWsVWuZb9u6YqeDpV5f6eIJWpf+oLcrlTYHYrdT8baKrrXLUubvs5Wt3a1fzVSumhOp1m0urKu8SYcl9vMnuU9TNWpC2nZtz2b3bt1Xz3Tkb32ge0fRai4fHjdrxRtNHMqPqJq5zZHxPT/pbcv8y/khG2kOkOZam3JrLNRrT25r9qi41DFbDEniifed5In5oVHL1P1Yz3Vu8R0dS6RKZ8iNprVQtdwbr03Tq93qv6dCZtBuytLM6C/6l7xxcnw2eN3vKn+M7w/lT6r4HKymuwvsuNttsseOrkWU1tOs0txrX8CRs323TZF23Xf3U57JzUYD2xFlrKtucY7DDStjV9O60tc56v8ABjke/Zd/PdPkVU46vZ/jWjOBR1DKOBknCsNst0KIxJXonTZOjU5Kq/8AcoBqXqPluoN4fcMiukszFcvdUrHK2GJFX4Wt6bfqdrr5qbW6qZx+2308lHQQRJT0VIr+Pu2dVVV2T3nLzX6Jz2Nn0S7O+XZ6+K53SN9gx/4nVVQzaWZv+Ezqv8ztk+fQg7vsHSX/AP4vyxUL50tLbfK64NVy92icuBfLi4ttvTckDtY9oJaH2nBcGrf4pUWO5XGNf7pPGONU+15u8OiGr6vajYtpbj1Rpho+xkdS9OG7Xhq7yb9Fa13i9ee6pyb4EJWvCK+fA7pnl4c+ktMLkp6R7/jrqp68mM36o1EV7neTVROa8qjUf3ksi/FJLI75q5V/3LGXjVWfSTSq26aYZPE3IHRumvNe3Z3s0sibrGzw7xE2RV8FRdufNK5xSSQysmiVzXxuRzVb1RUXfc3nGtN73eNPr9qDcFfS2a2Q7snem7qudzkajG79ebkVVA17E7bdsozS2WyjmmkuVwrWMbKrlVyPc5N3qvXlzVV9D0P7QOqdFpZhL69Gw1N3qEWOgpXP+N/i923PhTqv5FNOyjU2ay6j1OX3+dkVusFumqnL1csipwsRvm5d1RE81NN1Zzy76jZpWZFdnKxJXK2mpkdu2nh391ifTqvivMC1/ZR1yy/UTMLjYMojoZWJTLUQTQQ92rNnInCqIuypz+fLxOB25dVEoLazTmyVSJV1TUluj2L/AHcXVsfzd1X028yL+zXlNs0vwPLNQ69rZLhMrLXaYF/50u3G76J7ir8/UhG/3Wvvt6rLzdKh1RW1krpppXLurnO6hamXsRY1+3dZ4bnLFxU1lpn1jlVOj/hYnz3dv/lU7Xtw6jwZXm1LiloqEmttk4u+exd2y1Lvi+jURET1V3malheoTNOdHK+349OiZRlFQvtNQzrQ0caKxiej3OWRU8mqi+Kb65ohiUufarWXHppFWOpnWaqeq/8AKYivk6+KogRdHsZYzV4zonSzV/EyS5zvrkY77DFREb+bW7/Urn2xtVv7b5h/Zqyzq6yWl6sVzXLw1M/RzuXVE6J9SUO1brlS43aXadYJUx+2JF3FbVwKnDSRom3dM/GqclXwT16Rp2P9H5MzyduX5DSuXHrbJxxskbyrJ06J6tavNfXZPMioYyrF7/jHsDL9QzUK1dO2opopFTiWN3R2ydN/U3vs66M3HVS/OWaR9Fj9G5PbKtG7ud/hs8Fcvn0Trz8et1YuVz1F10uMEciOmrbqltomO91rGpJ3UaJ5Jvsv1PQ3TTEbTg+G2/HLPG1KeljRHSImyzP+09fVV5/oB9sAxKxYNjMGP49SezUMO7tlcrnPcvVzlXqqnIy3J7HilknvOQXCGgooU3dJI7bdfJE6qvohp2tmruM6X2N09ymSrusrf4S3RO/eSu8FX7rfNV+m5RLN8yz7WjMYmTNqLjUSyq2ittK1e6iRfBqf1cvPlupFre+0B2jb7n081jxhJ7PjyrwLs7aoq083qnwt8mp9VXoc3s/dmm75esGQZmlRaLEuzooOlRVp6J9hvqqbr4J4ku9nvs0WzFGU2Q5ukF1viIj46RE4oKVeqfzvTz6J4b9Vsg1qI1ETkiJyRE22LR1OJYxY8Us0Nox+3QW+iiTZscTdt181Xqq+qncAEAAADCrsHKqbbJuRfrlrTjGl1u2rlWvvMrN6a3wu2c78T1+w315r5IoKk6SVkbFfI5rGt5qrl2RE9TVcp1KwXGLc+vvOTW2CFi8OzZkkcq+SNbuqr6Ih586n60Z7qBWPkud3lo6JVVY6GjescTE8uS7u+aqpHe2/NVXnzX1ESvTvTjV3AtQaiWlxi+MqaqNFVaeWN0UitT7SNeiKqeqG+Hn/ANiPGLrdtYYL3TMlZQWqN76mZE2bu5Nms38VXy8uZf5XIjd1VEROq79AV0+a5LbMSxevyG8TNho6OJZHrvzXyanqq8kPNvPcnyHV/U2S4Tc5q2XuqWFXbR08KL7qbryRETdVX5qS925dTlvuSxYDZ6pq222Kktc+N26TVCpyZy8GIv8AqcvkhWqKWWJXLFI5ivarXK1dt0Xw+RcKnHJdULZp/gv/AA40tqWufI3/AONZAxNpKqXo5sPijU6cXXbp5mu6I6LZZqpcfaYU9gszX7VNznaq+qoxOr3/AKJ4qRa1rnuRjUc5zl2RE6r6Fu+zNmMOkOmdyqtRrwlFSVMrZrVa1XvKtybLxK2JObUcu3xbJ4qUT5pfpRhGm9vayx2yNaprP31fUbPnf5qrl+FPRNkIN7U3aKpaeiqsLwKtbNUSosVfconbtjb0Vka+Ll8XeBGGuPaQyfPWTWewxS2GxP8AdWNj956hvk9zeifhb+p2XZ37N12zCWG/5lFNbbAio+Knd7s1Z49OrWeq818PMDjdkbRyozbJ4srvtO9uP2yVJGNkbyq5k5o31ai81/Ivq6Rsce7tmtanNVXoRpnOp2mmkVihttTWU8C08XDS2qgajpVROiI1OTU9XKhUTWTtH5lnqS220o6wWZ6q1KaCRVmlb/iP5L9E2+pNHA7UWq9XqNnVTS0dQ5uO2yR0NDE1y7Sqi7Omd5q5enkm3rvreiemV81Ny2G1W+J7KGNyPrqxW+5BHvz5/eVOidTgaRWTF8jz232rL746y2qZy8dTwp7zk6M4l5N4l5cSnoRb6zTDSbBm+yV1rtVoiZxoscrXPnXbryXd7lA2O63CzYNhUlbcKhKe12qkTie5d14WIiInqq7InzKmU/a2yyu1HpEgs9AzHZKlsPsfArpnMV23Er9/j6LsibeGy9TSe0dr7ctS3rZLVTutuMwy8TI3/wB9Uub0dIqckTyanzVVN27JugFwrrpbs/zCBtPbIFSot9E9P3lQ/q2R6eDE6onVfROtFz+8RkaveqI1E3VV5bJ6mtY1qJheSXqpstjyO319wpt+8gilRXcuqp5onjsRB21tUJcRw+LErNUcF3vbHJLI1fep6bo5fRXL7qL5I70IS7DOIXO76tR5XGjorbZIZVlk35SSSxujbH6/Erl/lTzIVfXiXyNN1H1QwrT6mSXJ7zDSyubxR0zN3zSJ+Fic/r0OVqXmllwHEK3I75UIyGnjXu490455Nvdjaniqr+XVTzuqH5Trdq85yM3uF2n5NVyrHSwp5r9ljG9f+6khU+Zh2y1SWWHEsOa5ico6i51C+984o+n+s4ejXafzbItS7VY8gorVLb7lUJAvs1O5j4lXorV4l3TfwXf5lcdQLVY7Fks9msN2kvMVJ+6mru7Rkc0ifEsbea8CLyRVXntunIs/2NtEKyhnptRsqp+5fw8Vpo5G7P2VP75yeG6L7qeXPy3sRblV2Q/LnbeG5oOqmr+Eac0fHf7ojqxybxUFMiSVEn+VF5J6qqIVP1K7WOa358lLikEON0P2ZEXvalyerl5J9E5eaiLVndZtcsM0zYtLcJZLjeFbvHbqRUWRPJXqvJifPn5IpXW49snNH1vHbsUsEFLv/d1DpZZNv5kc1P8A9Stt0r6y6189wuNVLVVdQ9XyzSuVznuXxVTir5eHiIVe/A+1jgdysHtGVxzWK5MkSN9PHG+dkm/22OanTzRdtvUn2x3Sgvdopbta6llTRVUaSQysXk9q9FPJmgjiqLhDTSztp2SSNY+Z/RiKu26/LqehWGaq6MYHgtqx6mzu3T09vpmxNdGrpXOXqq7NRV5qqiFTQq9eS8hxctyreqXa7sVBG6j0/tr7tVLy9trI3RU7fkzk9314fqSF2XNV7jqnitfVXehipbjb6hIpXQIqRyNcm7VTdV2XzIqYwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGFXbxNM1Q1OxDTq1e25JdIopXovcUcao+onX8LOu3mq7InmErcldtuq7IiEM6x9ovB8A7630s/7fvbOXslG9FZG7/Ek6N+Sbr6IVf1n7SGZ5w+e22h77BZX7tSKnftNK38b05/RORB6qqqqruqrzXfmWFSNq1rRm2o0747tcVpbaq+5QUqqyFE/F4u+poVpttwvFxht9so6iurJ3o2KCnidI96+SIibqSronoBmGo7oq+SJbNYVXnXVLFRZE8e6Z1d8+Sf0Lu6UaU4fpxQpBYre11W5u01dMiOmk8/e8E9E2FIrv2eey8tTBHkOpdHUU7uPeG0OVEVUT7Uiou6b/d6+Zbq02+htlBDQW6khpKSBiMihhYjGNRPJEOVsm++xkUiNNctHcc1Vt1PHc5JqOvpEclNWQoiuYi7btVF+JvJORAMXYxuC1bUlzulWl35q2gXjVP9excnbmYVEXqgqvL7UXFq7S3VSos9VG6dLbVsmpnzM2SoiRUcx3LwVE8PXyJQ1b7UeQ5bj0dkxu2uxyGWPhrZWTccknL4WKiJwN+m5brVbS/ENSaGOnySg45oEVIKqF3BNEi9URyeHovI0HD+y5pnYbk2uqoqy8vY7iZHWSp3aKnTdqbcX1FSK6dmzQS66h17MhyKOegxmJ+/E5FSSud4tZv0b5v+ieKptPbyrIbVV4pg9qp20droaN1S2GJvC3dVVicvRGr/AKlLpUtNT0tNHTU0EcEMTUZHHG1GtYidERE5IhpGqWk+F6kvo5cooJppqPdIpYZljfwqu/Cqp1bvz2FIo52cNHbnqlkrZKhklPjlG9HVtUibcfj3TPNy+Pkn0LP9sOgo8e7N77PZ6ZlHRRVVNTxxRJs1rEVV/wBkJqxPHrNi1jp7LYqCKhoYE2ZExPzVV6qq+Z1+qGGWvPsKrsYu6yMgqmpwyx/FE9ObXp5qi+ApHljC6dU7iHvNpVRO7ZuvGu/JNvEkHU3STJdP8Qx6/X2B0cl3R7pYNv8A5VeSsY9fB6oqqqeHTruW50Z7NGMYJff25cqx99uEL96RZYkbHBt0dw893eqk032yWjILbJbb3bqa4Uci+9FPGjmr6p5L6ikeWOL2XIMrulHjlkpaivqZpV7mnZ8LXO2Rzl8G8mpuq+CEk67aF5Fpy211VPBUXWgmpG+11cMaubFU7rxsVET3W9OFV6l98RwrE8RhdFjdgoLYjk2c6GJEc5PJXLzVPqd/snkKR5waJ6E5hqPcGTLSz2iwtXeW5VEatR3L4Y2rzeu/inJPFU6HW5lp9qPpVlcypQXakSNz46e50bHLHMxybe69qbbqi806p4oh6ZbJ5GOFPIUjz90K7PWV57d4rvk9LVWfH2u45Jahqtnque6oxq8+f3l2Ty3L4Y7ZrZYbLTWa00kdLQ00aRxRMTZGtT/f1Oy2TyDk5cuopHnx2hdGM0xTUGvvNptFdcbTX1jqqlq6ONXrC5zuLhcjebFRy8l6dNlNmwvWrKdKNKamw37v6vJambitlNWKqvo4VTm+VF5puvNrF57c9tusw9qjXaHT+hdjWNTxzZNUs3c/4m0TF+078S+CfUqxo1pjlOsmZSzvnnShSXvbndZ93bKvNURV+J6+Xh4hHX4hi+da2Z7L3Mk1wrqh/eVlwqFXu6dir1cvgngjU5r4IXw0R0fxjTCzNhtsSVd0kaiVVxlaneSr4on3W+ifqbFpxhGO4HjkVjx2hZTwM5yPXnJK7xc93ipswWMI1E6GQCKABegAw7dE5HwrKqCjppKmrqI4IYmq+SWRyNa1E5qqqvJEK16zdqyx2Zs9qwGOO9V6btWufv7MxfweMnzTl8wlWMut4tlr7pLjcqSjdM7gibPM1iyO8GpuvNTy41Kul+vGeXivyZJW3SSqelRHIiosSou3AiL0ROiId/bbfqVrfmbnRe23u4PciyTSO2gpm79Vd8LGp4InNduW6l67fo5h9zxqz0+bWK3X68UVFFTz1z2uR0rmtRN1ciorvmvMDzVia+R6MY1XOXkjWpuqqfqWOanmWKeJ0b2rzY9Nl6nqRjGmmA4zKyWx4laaOVi7skSBHPavo526p+Z9so0+wjJ5Flv+L2uvlXrLJAiPX5uTZV/MtIopiPaIynDcVix7E7FYrVTxJzlZTue+R/i96uVeJy+amuZZrHqhllPIy45PcvZl5uZTIsUaJ/lROX1L30uhmklNOk8OC2pHp0VyPcn5K7Y5ub6fWa46c3vGLDa7ba3V9E+CNYKdsacSpy34U80TmKR5gyOc97pHuVznLurnLuqr5nY0FgvldZK690dprKi20DmNqqmOJVjhV+/Cjl9diYcM7L2pt1yf2C+W6Oy22J+01a+dj0c1F/5bWqquVU80RC7uB4Vj2H4lDi1pt8SUEbNpUe1Hd+5fic/f4lXx3FI8taL2tKlklGkvfMXiYsaLui+m3iShguguqudztrEss1FSzLxOr7s5YkX1RF3kd80aqeqHobasax20yrLarBaqCRer6akjiVfq1EO04U8hSID0p7NeK4NTJda9rciv8UavifUt2p2SInLhj5+O3NdyqGQ6qaySXGsoblkd/pah71jmpUa6LgXpwoiInD9D0r2TyOO630DqpKp1FTLUJ0lWJONPrtuKR52aa6C6lahV3tk9BUWuhkdxS3G6o5nGnm1rvfkX16epbjSLs9YNgUcdVNS/ty7cOz6usjRURfHgZ8KJ+a+pMaIieBnZPIUiluu/ZZvVNdai+acx+30U7lkktiva2WBev7tXKiOb6b7p6leMxxDLMSkpqbKbJXWqSZHLA2qarUeibbq305oerGyInToefPbirbpU6811PWteykpKOnjoN0XZ0axo9yp/9xz0/wAoI+HZJ0pdqHmq3K507lx6zq2SpVU92eTq2JPy3X0T1QuFrHq3iWlVi/jp4p7ksfDRWuByd7JsnLdPsMTzX6bryKaWHX3IMV01o8Mwq3UtlZE1zqmt+OaaR3xP58kXp8ttvA63TjSzUbWG8y3GBtTJTPk/irvcXO7vfyRV5vd6N6eOxSOkyu/ZPq9qYyqqGpPdLpUMp6aCPfhYi+6xieSJ5l0rfccI7NmklJbbvWxzXFyK90FOnFNW1Cp73Ci9Gp04nbIievIpzmun2oWleU95PQXCmkppOOlulJG5Ynp4Oa9u6IvovNDn4fpdqtqteG1aUVynbIqd7dLo57ImJ6Odzd/K3clI+OqeoWX605pBElNPM18nd221UyOejN15Jt4uXxX+hMd7wObQjs7XW61Kx/2vyBY7fLNG7nSxybq6Nrk8eFFRVTxXl0Jz0I0Tx3S6iWeNUuN7mYjZ66Ru3Cni1ifZb+qn07UOC3DUDSWttNoYklyp5WVlLFyRZXM3RWIq+Ko5dvXYUimnZts2FPyGpyzUG6UtNZLIjZWwy81qpl+FiMTm/bbfZEU3bWLtT5Ffpp7bgjHWO0t3Y2oc1PaZW+fijE9E3+ZGOM6Kap5Bc3UFJhN3pnI/hfLWwOp4o9uSqr37Iv03Utbot2XsZxVsNyy90WQXVuzu6Vv8NEvkjV+L5ry9BSKx6ZaP6h6sXR1yihqIqOV/FUXe48XA5fHhVfekX0Tf1VCy1N2SsLpsJrLclfVVN+ni2juU3wxP/DGnLh8PPYsdDDFDCyGGJkcbGo1jGt2RqJ0RE8EP1sgpHn7cOylq1TV609NSWmsh32bUR1zWs289nbO/QkDTjse1aVUdVnl/p+5bsq0dt4nK/wBHSORNk+SfUuHsnkNk8iEVa1S7JFputQtdgt1is7+FGuo6lrnwqu226OT3mqvjyUjmPsd6kLUIkl8xZsW/vPSonVyJ8u6T+pevZPIbIWkVWwbse2ajqUqMvyOe5omy+z0cXcx/JXKquX6bFj8PxXH8Ss0dox22QW+jZz4Im7cS+ar1VfVTutk8gQAAFAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAw/mnUDJxLtX0VroJa+41cNJSQNV8s00iMYxE8VVehH+s+seJ6ZULkulUlVdHs4oLdA5Fld5K77rfVfoUW1j1izDU6ucl2rFpbUx+9PbYFVIWeSu++71X6IgSp/1u7V1PAk9m03Yk8nwOus7dmJ15xsXr81/IqVfrxdL9dJrpeq6orq2Z28k071c535+HofC3UVbca6KgoKWaqqZnIyKKFivc9V8EROalm9GeyfdLp3N21BndbKRdnNt8Kos708nO6M/VSiv2BYVk2c3ltoxi0z18+6d65jdo4W/ee5eTU+f0Lk6K9l7HMX7i7ZisV+urdnJA5v8ADRO/l+39eXoTnh+K4/iFmjtGOWqnt1HHz4Im7K5fvOXq5fVTu06CkfmOOOONscbGsY1ERrWpsiIngiH6AIoAAAAAAAANkAAAABsnkgAAAAAAAC9CJu0pqzTaXYYstPwT3y4bx2+BeaIvjK78Lf1Xb1JXlcjI3PcuzWoqqvkh5qa2ZNddU9a6paRH1He1iW+2Qb77N4+BiJ/MvP6gfnSPAsm1m1DmbLVTOjfJ7RdblJ73A1V5/wCZeiJ/sh6IYHilkwvG6bH7DSNpqOnbtt9p7vF7l8XL1VTpNEdPrdpvg9JYaNrX1HCklbUbc5plTmvyTonohvRakAARQHS5XlGO4tQrXZDeaK2U/g6eVGq7+VOrl9ERSvmo/a5xi2I+lw61z3io5tbUz/uod/NE+JyfkBZapnipoZKiomjihjbxPe93C1qJ1VVXkhAuq/aiwnF2zUGNyf2jubd27wO2p2L6v+1/l3+ZU/MNRNT9X7wy2VFXXXBJnbw2qgYqQp5LwN+L5u32JU0r7JWQ3Xuq3OK1LPSLs5aSBUfO5PJV6N/UCLM61I1H1fvbLbUT1lYk709ntFA13d7pz+BvxKnmvT0Ji0e7JdfWrDdNRKpaGBdnJbaZ6LK5PJ705N+m5aHTfTvEdP7etJjFmgo3PaiTVCpxTTbfeevNfl09DbQkdNh+M2LFLRHacetdPbqOPpHEzbiX7zl6uX1U7kAKAAAAAAAAAAAAAAAAL0U0bUzSzCtRo4Uye19/PA1WQ1MUislY37qOTqm+67Lv1U3kAQxjfZo0mslYyq/YtTcnNXdra+oWRiL58KIiL9SX6CjpKCljo6KmhpqeJqNjiiYjGMROiIickOQAAVEVNl5gABsnkAA2TbbYbJ5IAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAPhcKmKioKisnVUhgidLIqJv7rUVV/RAFdV0tFSS1VZURU8ETVdJJI9GtYieKqvQqjr32poadZ8f02ek0/Nkt2e3djPPumr1X8S8vIhPXvW/I9TbtNBHNPbsdikVKagY7ZHonR8u3xOXy6J4eKr0mmOkeb6iVTG2K0ytolXZ9bUIrIGp58X2vpuVK0u5V9dc6+a43Grnqquoer5p5nq973L4q5eaqS/o32ds0z1Ya6sgdY7K7ZVqqpio+Rv4GLzX5rsnQs5ov2a8OwZYbneEbkN6Zs5Jahn7iB3+HH5/iduvlsTnG1Gt2RERE5IieQGgaTaQ4ZptRI2w2xj7g5vDNcahEfUSefP7KfhbsnnuSA3oZBFAAAAAAAAAAAAAAAAAAAAAAAAAAB8quPvaSaJF2V7Fbv802PMGv/AGxphrJ7TPS/x1juqVDI5k2bKjJOJv0ciJz9T1Dcm6KhGesWimGanxsnvFPLR3SJOGK4Uio2VG/dduio9voqbp4KgGo4t2qNMbnRRy3KprbVVKiJLFLArmtd47OTqh29d2ltIaVm6ZFJPt4Q0z3L+qEJXzsZ36KZy2TMLdUxeCVcD43bf5eL+pwaDsb5o+RPbMmsMEe/PgSR7v8A2oUSHlHbBwyka9lgsV0ukn2XS7QsX59V/QhzN+1ZqVfY3wWd1Dj0L+XFSxd5Mifzv32+iIpK2N9jSwQOa+/5fcaxPGOjgbD9OJyu/oS9hWhel2JOZLbcTo56lnNKiuVamTfz99VRq/yogFEcfwXVLVK6rWR2+83eSVffr6571Zt/9R/gnkm+xYDTnsewt7urzq/OkXkq0dv5J8lkX/ZPqWziibE1GRsaxqdEaiIifQ+qdBRrWC4LieEW5KDGLFSW6NfjfG3eST1e9fed9VU2UAgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAYe1HMVqoioqbKi9FMgCL7ZoBpLb75LeIcOo31Ej+NGTPfLCxfwxuVWpz9OXgSVTU0NNA2CnhihiamzWRtRqInoiH2AIwibL1MgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAH/2Q==', '2026-09-19T19:24:10.770Z', 1, '2026-10-07T16:47:08.456Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 14)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (14, 3, 1, 2, NULL, 'hello', '2026-09-28T18:44:46.690Z', 0, NULL, 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 15)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (15, 5, 13, 4, NULL, 'hello', '2026-10-09T09:55:19.020Z', 1, '2026-10-09T10:26:57.433Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 16)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (16, 5, 13, 4, NULL, 'IMAGE_ATTACHMENT:data:image/jpeg;base64,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', '2026-10-09T09:55:24.856Z', 1, '2026-10-09T10:26:57.433Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 17)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (17, 3, 1, 2, NULL, 'hello', '2026-10-09T11:20:04.863Z', 0, NULL, 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 18)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (18, 6, 1, 13, NULL, 'hello', '2026-10-09T12:12:07.393Z', 1, '2026-10-09T17:47:47.813Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 19)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (19, 6, 13, 1, NULL, 'HI', '2026-10-09T17:48:29.673Z', 1, '2026-10-09T17:53:55.300Z', 0);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Messages] WHERE [MessageID] = 20)
BEGIN
    INSERT INTO dbo.[Messages] ([MessageID], [ConversationID], [SenderUserID], [ReceiverUserID], [BookingID], [MessageText], [SentAt], [IsRead], [ReadAt], [IsDeleted])
    VALUES (20, 6, 1, 13, NULL, 'hi', '2026-10-10T14:34:11.120Z', 1, '2026-10-10T20:53:43.840Z', 0);
END;
SET IDENTITY_INSERT dbo.[Messages] OFF;

-- --------------------------------------------------------
-- Table: dbo.[Notifications] (91 records)
-- --------------------------------------------------------
SET IDENTITY_INSERT dbo.[Notifications] ON;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 9)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (9, 13, 'Application', 'Service Provider Application Submitted', 'Your application to become a SoundSphere Service Provider has been successfully submitted and is now waiting for administrator approval.', 10, 'Application', 1, '2026-08-29T13:47:14.303Z', '2026-08-29T22:07:18.120Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 10)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (10, 4, 'Application', 'New Service Provider Application', 'Denver Cabrera has submitted an application to become a SoundSphere Service Provider.', 10, 'Application', 1, '2026-08-29T13:47:14.523Z', '2026-08-29T13:49:34.923Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 11)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (11, 13, 'Application', 'Service Provider Application Approved', 'Congratulations! Your application has been approved. You are now an approved SoundSphere Service Provider.', 10, 'Application', 1, '2026-08-29T13:49:14.783Z', '2026-08-29T22:07:17.060Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 24)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (24, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00002 for bundle a for wedding on 2026-09-07 has been successfully confirmed.', 16, 'Booking', 1, '2026-09-06T15:59:11.543Z', '2026-09-06T16:01:42.763Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 25)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (25, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-09-07 (18:00 - 22:00).', 16, 'Booking', 1, '2026-09-06T15:59:11.583Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 26)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (26, 13, 'Payment', '🎉 Payment Released by Admin', 'Admin has released your payout of ₱14,962.50 via PayMongo for Booking SS-2026-00001!', 9, 'Booking', 1, '2026-09-06T17:20:49.176Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 27)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (27, 13, 'Payment', '🎉 Payment Released by Admin', 'Admin has released your payout of ₱722.00 via PayMongo for Booking SS-2026-00002!', 16, 'Booking', 1, '2026-09-06T17:35:56.986Z', '2026-09-06T20:14:23.423Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 28)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (28, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00003 for hkcdtusea on 2026-09-20 has been successfully confirmed.', 17, 'Booking', 1, '2026-09-06T20:50:30.923Z', '2026-10-05T20:50:20.620Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 29)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (29, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (hkcdtusea) for 2026-09-20 (21:00 - 03:00).', 17, 'Booking', 1, '2026-09-06T20:50:30.973Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 30)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (30, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00004 for bundle a for wedding on 2026-09-21 has been successfully confirmed.', 18, 'Booking', 1, '2026-09-07T10:21:11.986Z', '2026-10-05T20:50:19.160Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 31)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (31, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-09-21 (18:00 - 22:00).', 18, 'Booking', 1, '2026-09-07T10:21:12.060Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 32)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (32, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00005 for bundle a for wedding on 2026-09-25 has been successfully confirmed.', 19, 'Booking', 1, '2026-09-07T11:22:14.693Z', '2026-10-05T20:50:17.306Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 33)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (33, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-09-25 (18:00 - 22:00).', 19, 'Booking', 1, '2026-09-07T11:22:14.740Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 34)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (34, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00006 for bundle a for wedding on undefined has been successfully confirmed.', 20, 'Booking', 1, '2026-09-10T14:58:21.216Z', '2026-10-09T12:15:43.766Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 35)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (35, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for undefined (18:00 - 22:00).', 20, 'Booking', 1, '2026-09-10T14:58:21.406Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 36)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (36, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00007 for bundle a for wedding on 2026-09-27 has been successfully confirmed.', 21, 'Booking', 1, '2026-09-10T15:03:35.593Z', '2026-10-05T20:42:19.906Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 37)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (37, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-09-27 (18:00 - 22:00).', 21, 'Booking', 1, '2026-09-10T15:03:36.180Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 38)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (38, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00008 for hkcdtusea on 2026-09-30 has been successfully confirmed.', 22, 'Booking', 1, '2026-09-10T15:28:27.746Z', '2026-10-05T20:50:14.756Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 39)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (39, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (hkcdtusea) for 2026-09-30 (18:00 - 22:00).', 22, 'Booking', 1, '2026-09-10T15:28:27.930Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 40)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (40, 13, 'Payment', '💸 Payout Sent by Admin', 'Admin has manually sent your payout request #2 of ₱14,962.50 via GCash / Maya E-Wallet to DENVER CABRERA (09516028992)!', 2, 'Withdrawal', 1, '2026-09-10T15:34:01.056Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 41)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (41, 13, 'Payment', '💸 Payout Sent by Admin', 'Admin has manually sent your payout request #2 of ₱14,962.50 via GCash / Maya E-Wallet to DENVER CABRERA (09516028992)!', 2, 'Withdrawal', 1, '2026-09-10T15:34:01.353Z', '2026-10-09T09:30:24.756Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 42)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (42, 13, 'Payment', '💸 Payout Sent by Admin', 'Admin has manually sent your payout request #2 of ₱14,962.50 via GCash / Maya E-Wallet to DENVER CABRERA (09516028992)!', 2, 'Withdrawal', 1, '2026-09-10T15:34:01.753Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 43)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (43, 13, 'Payment', '💸 Payout Sent by Admin', 'Admin has manually sent your payout request #2 of ₱14,962.50 via GCash / Maya E-Wallet to DENVER CABRERA (09516028992)!', 2, 'Withdrawal', 1, '2026-09-10T15:34:03.220Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 44)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (44, 13, 'Payment', '💸 Payout Sent by Admin', 'Admin has manually sent your payout request #4 of ₱479.75 via GCash / Maya E-Wallet to jenny de jesus (09955819060)!', 4, 'Withdrawal', 1, '2026-09-10T20:43:20.296Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 45)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (45, 13, 'Payment', '💸 Payout Sent by Admin', 'Admin has manually sent your payout request #4 of ₱479.75 via GCash / Maya E-Wallet to jenny de jesus (09955819060)!', 4, 'Withdrawal', 1, '2026-09-10T20:43:20.323Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 46)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (46, 13, 'Payment', '💸 Payout Sent by Admin', 'Admin has manually sent your payout request #4 of ₱479.75 via GCash / Maya E-Wallet to jenny de jesus (09955819060)!', 4, 'Withdrawal', 1, '2026-09-10T20:43:20.330Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 47)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (47, 4, 'Report', '⚠️ New Client Report: CHiCHa Lights and Sounds', 'Client filed Report #1 regarding "Unprofessional behavior". Action may be required.', 1, 'ProviderReport', 1, '2026-09-10T21:46:48.316Z', '2026-09-10T22:56:07.903Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 48)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (48, 1, 'Report', '📋 Report #1 Status: Resolved', 'Your report regarding "CHiCHa Lights and Sounds" has been resolved by SoundSphere Administration. Thank you for your feedback.', 1, 'ProviderReport', 1, '2026-09-10T21:46:51.760Z', '2026-10-09T12:16:08.480Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 49)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (49, 2, 'Message', 'New message from Denver Cabrera', 'Hello Provider! Can we confirm availability for August 15?', 3, 'Message', 0, '2026-09-19T16:05:15.796Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 50)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (50, 1, 'Message', 'New message from Denver Cabrera', 'Hello Denver! Yes, our line array system is fully available for August 15. We wo...', 3, 'Message', 1, '2026-09-19T16:05:57.270Z', '2026-09-28T18:44:28.770Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 51)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (51, 2, 'Message', 'New message from Denver Cabrera', 'Hello Provider! Can we confirm availability for August 15?', 3, 'Message', 0, '2026-09-19T16:08:17.926Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 52)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (52, 13, 'Message', 'New message from Denver Cabrera', 'hello', 4, 'Message', 1, '2026-09-19T16:09:17.543Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 53)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (53, 4, 'Message', 'New message from CHiCHa Lights and Sounds', 'hello', 5, 'Message', 0, '2026-09-19T18:55:24.753Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 54)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (54, 8, 'Message', 'New message from CHiCHa Lights and Sounds', 'hi', 4, 'Message', 1, '2026-09-19T18:55:34.760Z', '2026-10-05T20:50:13.843Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 55)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (55, 13, 'Message', 'New message from Denver Cabrera', 'IMAGE_ATTACHMENT:data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BS...', 4, 'Message', 1, '2026-09-19T19:18:20.766Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 56)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (56, 13, 'Message', 'New message from Denver Cabrera', 'IMAGE_ATTACHMENT:data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BS...', 4, 'Message', 1, '2026-09-19T19:24:10.786Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 57)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (57, 4, 'Report', '⚠️ New Client Report: CHiCHa Lights and Sounds', 'Client filed Report #2 regarding "Unprofessional Behavior / Harassment". Action may be required.', 2, 'ProviderReport', 1, '2026-09-19T21:53:49.246Z', '2026-10-08T10:06:37.420Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 58)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (58, 2, 'Message', 'New message from Denver Cabrera', 'hello', 3, 'Message', 0, '2026-09-28T18:44:46.773Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 59)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (59, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00009 for hkcdtusea on 2026-10-07 has been successfully confirmed.', 23, 'Booking', 1, '2026-10-06T18:18:50.360Z', '2026-10-09T22:20:57.180Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 60)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (60, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (hkcdtusea) for 2026-10-07 (18:00 - 22:00).', 23, 'Booking', 1, '2026-10-06T18:18:50.366Z', '2026-10-08T17:50:56.423Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 61)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (61, 4, 'Message', 'New message from CHiCHa Lights and Sounds', 'hello', 5, 'Message', 0, '2026-10-09T09:55:19.043Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 62)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (62, 4, 'Message', 'New message from CHiCHa Lights and Sounds', 'IMAGE_ATTACHMENT:data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BS...', 5, 'Message', 1, '2026-10-09T09:55:24.880Z', '2026-10-11T13:25:13.066Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 63)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (63, 13, 'Payment', '👑 Subscription Activated by Cashier', 'Your Pro Monthly Plan subscription payment of ₱499.00 has been received & activated by the Cashier via Over-the-Counter Cash! Ref: CASHIER-CASH-TEST-2395', 3, 'Subscription', 1, '2026-10-09T10:38:52.483Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 64)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (64, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00010 for bundle a for wedding on 2026-10-18 has been successfully confirmed.', 24, 'Booking', 1, '2026-10-09T11:12:14.960Z', '2026-10-09T12:15:11.400Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 65)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (65, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-10-18 (18:00 - 22:00).', 24, 'Booking', 1, '2026-10-09T11:12:14.970Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 66)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (66, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00011 for bundle a for wedding on 2026-10-30 has been successfully confirmed.', 25, 'Booking', 1, '2026-10-09T11:14:00.570Z', '2026-10-09T12:11:33.236Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 67)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (67, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-10-30 (18:00 - 22:00).', 25, 'Booking', 1, '2026-10-09T11:14:00.576Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 68)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (68, 2, 'Message', 'New message from Denver Cabrera', 'hello', 3, 'Message', 0, '2026-10-09T11:20:04.883Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 69)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (69, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00012 for bundle a for wedding on 2026-10-10 has been successfully confirmed.', 26, 'Booking', 1, '2026-10-09T11:24:57.773Z', '2026-10-09T12:15:01.786Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 70)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (70, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-10-10 (18:00 - 22:00).', 26, 'Booking', 1, '2026-10-09T11:24:57.776Z', '2026-10-09T17:08:32.943Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 71)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (71, 13, 'Message', 'New message from Denver Cabrera', 'hello', 6, 'Message', 1, '2026-10-09T12:12:07.440Z', '2026-10-10T12:40:48.370Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 72)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (72, 1, 'Message', 'New message from CHiCHa Lights and Sounds', 'HI', 6, 'Message', 1, '2026-10-09T17:48:29.713Z', '2026-10-10T14:34:32.936Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 73)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (73, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00013 for bundle a for wedding on 2026-10-16 has been successfully confirmed.', 27, 'Booking', 1, '2026-10-09T18:09:08.136Z', '2026-10-09T20:58:43.130Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 74)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (74, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-10-16 (10:00 - 22:00).', 27, 'Booking', 1, '2026-10-09T18:09:08.143Z', '2026-10-10T12:40:29.830Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 75)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (75, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00014 for bundle a for wedding on 2026-10-16 has been successfully confirmed.', 28, 'Booking', 1, '2026-10-09T18:10:22.586Z', '2026-10-09T20:58:43.130Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 76)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (76, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-10-16 (10:00 - 22:00).', 28, 'Booking', 1, '2026-10-09T18:10:22.593Z', '2026-10-10T12:44:00.020Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 77)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (77, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00015 for bundle a for wedding on 2026-10-16 has been successfully confirmed.', 29, 'Booking', 1, '2026-10-09T18:11:15.913Z', '2026-10-09T20:58:43.130Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 78)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (78, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-10-16 (10:00 - 22:00).', 29, 'Booking', 1, '2026-10-09T18:11:15.923Z', '2026-10-10T12:40:24.880Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 79)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (79, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00016 for bundle a for wedding on 2026-10-16 has been successfully confirmed.', 30, 'Booking', 1, '2026-10-09T18:14:00.653Z', '2026-10-09T20:58:43.130Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 80)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (80, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-10-16 (10:00 - 22:00).', 30, 'Booking', 1, '2026-10-09T18:14:00.656Z', '2026-10-10T12:40:36.593Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 81)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (81, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00017 for hkcdtusea on 2026-10-15 has been successfully confirmed.', 31, 'Booking', 1, '2026-10-09T18:17:53.630Z', '2026-10-09T20:58:43.130Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 82)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (82, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (hkcdtusea) for 2026-10-15 (08:00 - 22:00).', 31, 'Booking', 1, '2026-10-09T18:17:53.636Z', '2026-10-10T12:40:53.626Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 83)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (83, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00018 for hkcdtusea on 2026-10-17 has been successfully confirmed.', 32, 'Booking', 1, '2026-10-09T18:30:21.500Z', '2026-10-09T20:58:43.130Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 84)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (84, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (hkcdtusea) for 2026-10-17 (08:00 - 22:00).', 32, 'Booking', 1, '2026-10-09T18:30:21.510Z', '2026-10-10T12:40:13.173Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 85)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (85, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00019 for bundle a for wedding on 2026-10-17 has been successfully confirmed.', 33, 'Booking', 1, '2026-10-09T19:36:16.510Z', '2026-10-09T21:01:14.910Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 86)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (86, 13, 'Booking', 'New Booking Received!', 'Denver Cabrera booked your package (bundle a for wedding) for 2026-10-17 (08:00 - 22:00).', 33, 'Booking', 1, '2026-10-09T19:36:16.516Z', '2026-10-10T12:22:02.656Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 87)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (87, 1, 'BalanceDueReminder', 'Payment Reminder: Remaining Balance Due Tomorrow', 'Your booking for "bundle a for wedding" (Ref: SS-2026-00016) is scheduled for tomorrow, 2026-10-11. You have an outstanding remaining balance of ₱380.00. Please settle your balance.', 30, 'booking', 1, '2026-10-10T10:01:23.740Z', '2026-10-10T10:17:22.040Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 88)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (88, 1, 'OverduePaymentReminder', '⚠️ Urgent: Payment Overdue', 'Your booking for "bundle a for wedding" (Ref: SS-2026-00002) was due on 2026-09-07 (33 days ago). You have an overdue balance of ₱380.00. Please settle this payment immediately.', 16, 'booking', 1, '2026-10-10T13:04:12.186Z', '2026-10-10T14:43:11.073Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 89)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (89, 1, 'OverduePaymentReminder', '⚠️ Urgent: Payment Overdue', 'Your booking for "bundle a for wedding" (Ref: SS-2026-00006) was due on 2026-10-01 (9 days ago). You have an overdue balance of ₱255.00. Please settle this payment immediately.', 20, 'booking', 1, '2026-10-10T13:04:15.420Z', '2026-10-10T14:43:07.093Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 90)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (90, 8, 'OverduePaymentReminder', '⚠️ Urgent: Payment Overdue', 'Your booking for "bundle a for wedding" (Ref: SS-2026-00007) was due on 2026-09-27 (13 days ago). You have an overdue balance of ₱255.00. Please settle this payment immediately.', 21, 'booking', 1, '2026-10-10T13:04:17.710Z', '2026-10-11T10:09:14.490Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 91)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (91, 13, 'Message', 'New message from Denver Cabrera', 'hi', 6, 'Message', 1, '2026-10-10T14:34:11.146Z', '2026-10-10T21:04:01.843Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 92)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (92, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00020 for Birthday Package on 2026-10-11 has been successfully confirmed.', 34, 'Booking', 1, '2026-10-10T20:47:55.316Z', '2026-10-10T20:51:19.096Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 93)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (93, 13, 'Booking', 'New Booking Received!', 'Princess Vizconde. Cornejo booked your package (Birthday Package) for 2026-10-11 (11:00 - 22:00).', 34, 'Booking', 1, '2026-10-10T20:47:55.330Z', '2026-10-10T21:04:11.600Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 94)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (94, 1, 'BalanceDueReminder', 'Payment Reminder: Remaining Balance Due Tomorrow', 'Your booking for "Birthday Package" (Ref: SS-2026-00020) is scheduled for tomorrow, 2026-10-11. You have an outstanding remaining balance of ₱750.00. Please settle your balance.', 34, 'booking', 1, '2026-10-10T21:18:24.610Z', '2026-10-10T22:33:03.763Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 95)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (95, 1, 'Payment', '🔄 Refund Request Submitted to Cashier', 'Your payout request #1 for ₱100.00 via GCash has been submitted. The Cashier will manually disburse the payment to your account.', 1, 'RefundRequest', 0, '2026-10-10T22:46:12.566Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 96)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (96, 1, 'Payment', '💸 Refund Disbursed by Cashier', 'Your refund payout of ₱100.00 has been manually sent via GCash to Denver Cabrera (09516028992). Reference: GCASH-REF-998822.', 1, 'RefundRequest', 1, '2026-10-10T22:47:01.643Z', '2026-10-10T23:15:54.716Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 97)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (97, 1, 'Payment', '🎉 Refund Credited to Your Wallet', 'A refund of ₱750.00 has been automatically added to your SoundSphere Wallet from cancelled booking SS-2026-00020. You can request a payout to your GCash/Bank anytime!', 34, 'Booking', 1, '2026-10-10T22:49:37.560Z', '2026-10-11T11:44:50.160Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 98)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (98, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00021 for Birthday Package on 2026-10-11 has been successfully confirmed.', 35, 'Booking', 1, '2026-10-11T10:14:39.730Z', '2026-10-11T11:31:54.203Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 99)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (99, 13, 'Booking', 'New Booking Received!', 'Mariel Fernandez booked your package (Birthday Package) for 2026-10-11 (18:00 - 22:00).', 35, 'Booking', 1, '2026-10-11T10:14:39.736Z', '2026-10-11T11:09:48.916Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 100)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (100, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00022 for Birthday Package on 2026-10-11 has been successfully confirmed.', 36, 'Booking', 1, '2026-10-11T11:34:07.380Z', '2026-10-11T13:39:46.160Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 101)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (101, 13, 'Booking', 'New Booking Received!', 'Larra Ayroso booked your package (Birthday Package) for 2026-10-11 (20:00 - 22:00).', 36, 'Booking', 1, '2026-10-11T11:34:07.383Z', '2026-10-11T14:49:33.256Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 102)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (102, 8, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00023 for Birthday Package on 2026-10-11 has been successfully confirmed.', 37, 'Booking', 1, '2026-10-11T11:34:58.770Z', '2026-10-11T13:39:46.160Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 103)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (103, 13, 'Booking', 'New Booking Received!', 'larra ayroso booked your package (Birthday Package) for 2026-10-11 (20:00 - 22:00).', 37, 'Booking', 1, '2026-10-11T11:34:58.773Z', '2026-10-11T14:43:58.373Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 104)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (104, 8, 'Payment', '🎉 Refund Credited to Your Wallet', 'A refund of ₱1,500.00 has been automatically added to your SoundSphere Wallet from cancelled booking SS-2026-00023. You can request a payout to your GCash/Bank anytime!', 37, 'Booking', 1, '2026-10-11T11:43:55.703Z', '2026-10-11T13:39:46.160Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 105)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (105, 8, 'Payment', '🎉 Refund Credited to Your Wallet', 'A refund of ₱1,500.00 has been automatically added to your SoundSphere Wallet from cancelled booking SS-2026-00022. You can request a payout to your GCash/Bank anytime!', 36, 'Booking', 1, '2026-10-11T11:44:06.633Z', '2026-10-11T13:39:41.893Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 106)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (106, 8, 'Payment', '🔄 Refund Request Submitted to Cashier', 'Your payout request #2 for ₱3,000.00 via GCash has been submitted. The Cashier will manually disburse the payment to your account.', 2, 'RefundRequest', 1, '2026-10-11T12:24:50.120Z', '2026-10-11T14:39:20.590Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 107)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (107, 13, 'Payment', '💸 Payout Disbursed by Cashier', 'Your payout request #5 for ₱486.40 has been disbursed via GCash / Maya E-Wallet to denver cabrera (09516028992). Ref: 09516028992', 5, 'Withdrawal', 1, '2026-10-11T14:34:52.656Z', '2026-10-11T14:49:27.250Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 108)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (108, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00024 for wedding package on 2026-10-11 has been successfully confirmed.', 38, 'Booking', 1, '2026-10-11T15:07:33.816Z', '2026-10-11T15:08:18.190Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 109)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (109, 13, 'Booking', 'New Booking Received!', 'Joy Anne Pungay. Basco booked your package (wedding package) for 2026-10-11 (08:00 - 22:00).', 38, 'Booking', 0, '2026-10-11T15:07:33.820Z', NULL);
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 110)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (110, 1, 'Booking', 'Booking Confirmed!', 'Your booking reservation SS-2026-00025 for wedding package on 2026-10-11 has been successfully confirmed.', 39, 'Booking', 1, '2026-10-11T15:12:16.463Z', '2026-10-11T21:21:47.983Z');
END;

IF NOT EXISTS (SELECT 1 FROM dbo.[Notifications] WHERE [NotificationID] = 111)
BEGIN
    INSERT INTO dbo.[Notifications] ([NotificationID], [UserID], [NotificationType], [Title], [Message], [RelatedID], [RelatedType], [IsRead], [CreatedAt], [ReadAt])
    VALUES (111, 13, 'Booking', 'New Booking Received!', 'Clent Dela Cruz booked your package (wedding package) for 2026-10-11 (08:00 - 22:00).', 39, 'Booking', 1, '2026-10-11T15:12:16.470Z', '2026-10-11T18:18:48.130Z');
END;
SET IDENTITY_INSERT dbo.[Notifications] OFF;


PRINT '✅ SoundSphere local data successfully synced to Azure SQL!';