package com.example.studystreak.config;
import javax.sql.DataSource;
import org.springframework.context.annotation.*;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
@Configuration
public class StudyLedgerSchema {
    @Bean(name = "studyLedgerSchemaReady")
    @DependsOn("entityManagerFactory")
    public Object initializeStudyLedger(DataSource source,
            @org.springframework.beans.factory.annotation.Value("${study-ledger.migrate-on-start:true}") boolean migrate) {
        if (!migrate) {
            new org.springframework.jdbc.core.JdbcTemplate(source).queryForObject("select count(*) from study_ledger where false", Integer.class);
            return new Object();
        }
        new ResourceDatabasePopulator(new ClassPathResource("db/study-tracking-v3.sql")).execute(source);
        return new Object();
    }
}
